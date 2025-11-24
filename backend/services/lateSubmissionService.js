import { pool as db } from '../config/database.js';

class LateSubmissionService {
    // Check if submission is late
    async checkLateSubmission(assessmentId, submissionTime) {
        try {
            const query = `
                SELECT 
                    scheduling,
                    late_submission_policy,
                    grace_period_minutes
                FROM assessments 
                WHERE id = ? AND is_active = TRUE
            `;
            const [results] = await db.query(query, [assessmentId]);
            
            if (results.length === 0) {
                return { isLate: false, message: 'Assessment not found' };
            }
            
            const assessment = results[0];
            const scheduling = JSON.parse(assessment.scheduling || '{}');
            const latePolicy = JSON.parse(assessment.late_submission_policy || '{}');
            const gracePeriod = assessment.grace_period_minutes || 0;
            
            const deadline = new Date(scheduling.end_date);
            const submission = new Date(submissionTime);
            const timeDifference = submission - deadline;
            const minutesLate = Math.ceil(timeDifference / (1000 * 60));
            
            const isLate = minutesLate > gracePeriod;
            
            return {
                isLate,
                minutesLate,
                deadline,
                gracePeriod,
                latePolicy,
                penaltyApplied: isLate ? this.calculatePenalty(latePolicy, minutesLate) : null
            };
        } catch (error) {
            console.error('Error checking late submission:', error);
            throw error;
        }
    }

    // Calculate penalty for late submission
    calculatePenalty(latePolicy, minutesLate) {
        const {
            penaltyType = 'percentage', // 'percentage', 'points', 'none'
            penaltyRate = 0, // percentage per hour or fixed amount
            maxPenalty = 100, // maximum penalty percentage
            gracePeriodMinutes = 0
        } = latePolicy;
        
        if (penaltyType === 'none') {
            return { penalty: 0, penaltyType: 'none' };
        }
        
        if (minutesLate <= gracePeriodMinutes) {
            return { penalty: 0, penaltyType: 'grace_period' };
        }
        
        let penalty = 0;
        
        if (penaltyType === 'percentage') {
            // Calculate penalty as percentage of total score
            const hoursLate = minutesLate / 60;
            penalty = Math.min(hoursLate * penaltyRate, maxPenalty);
        } else if (penaltyType === 'points') {
            // Fixed point deduction
            penalty = penaltyRate;
        }
        
        return {
            penalty: Math.round(penalty * 100) / 100,
            penaltyType,
            penaltyRate,
            maxPenalty
        };
    }

    // Apply late submission penalty to score
    async applyLatePenalty(submissionId, originalScore, totalPoints) {
        try {
            const query = `
                SELECT 
                    a.late_submission_policy,
                    a.grace_period_minutes,
                    s.submitted_at,
                    a.scheduling
                FROM assessment_submissions s
                JOIN assessments a ON s.assessment_id = a.id
                WHERE s.id = ?
            `;
            const [results] = await db.query(query, [submissionId]);
            
            if (results.length === 0) {
                return { success: false, message: 'Submission not found' };
            }
            
            const submission = results[0];
            const latePolicy = JSON.parse(submission.late_submission_policy || '{}');
            const gracePeriod = submission.grace_period_minutes || 0;
            const scheduling = JSON.parse(submission.scheduling || '{}');
            
            const deadline = new Date(scheduling.end_date);
            const submissionTime = new Date(submission.submitted_at);
            const timeDifference = submissionTime - deadline;
            const minutesLate = Math.ceil(timeDifference / (1000 * 60));
            
            if (minutesLate <= gracePeriod) {
                return { 
                    success: true, 
                    finalScore: originalScore, 
                    penalty: 0,
                    message: 'Submission within grace period' 
                };
            }
            
            const penaltyInfo = this.calculatePenalty(latePolicy, minutesLate);
            
            if (penaltyInfo.penaltyType === 'none') {
                return { 
                    success: true, 
                    finalScore: originalScore, 
                    penalty: 0,
                    message: 'No penalty applied' 
                };
            }
            
            let finalScore = originalScore;
            
            if (penaltyInfo.penaltyType === 'percentage') {
                const penaltyPoints = (originalScore * penaltyInfo.penalty) / 100;
                finalScore = Math.max(0, originalScore - penaltyPoints);
            } else if (penaltyInfo.penaltyType === 'points') {
                finalScore = Math.max(0, originalScore - penaltyInfo.penalty);
            }
            
            // Update submission with penalty information
            await this.updateSubmissionWithPenalty(submissionId, {
                originalScore,
                finalScore,
                penalty: penaltyInfo.penalty,
                penaltyType: penaltyInfo.penaltyType,
                minutesLate,
                penaltyApplied: true
            });
            
            return {
                success: true,
                originalScore,
                finalScore,
                penalty: penaltyInfo.penalty,
                penaltyType: penaltyInfo.penaltyType,
                minutesLate
            };
        } catch (error) {
            console.error('Error applying late penalty:', error);
            throw error;
        }
    }

    // Update submission with penalty information
    async updateSubmissionWithPenalty(submissionId, penaltyData) {
        try {
            const query = `
                UPDATE assessment_submissions 
                SET 
                    score = ?,
                    penalty_applied = ?,
                    penalty_amount = ?,
                    penalty_type = ?,
                    minutes_late = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            await db.query(query, [
                penaltyData.finalScore,
                penaltyData.penaltyApplied,
                penaltyData.penalty,
                penaltyData.penaltyType,
                penaltyData.minutesLate,
                submissionId
            ]);
        } catch (error) {
            console.error('Error updating submission with penalty:', error);
            throw error;
        }
    }

    // Get late submission statistics
    async getLateSubmissionStats(assessmentId, filters = {}) {
        try {
            const { batchId, departmentId, dateFrom, dateTo } = filters;
            
            let query = `
                SELECT 
                    COUNT(*) as total_submissions,
                    COUNT(CASE WHEN penalty_applied = TRUE THEN 1 END) as late_submissions,
                    AVG(CASE WHEN penalty_applied = TRUE THEN minutes_late END) as avg_minutes_late,
                    AVG(CASE WHEN penalty_applied = TRUE THEN penalty_amount END) as avg_penalty,
                    COUNT(CASE WHEN minutes_late > 0 AND minutes_late <= grace_period_minutes THEN 1 END) as grace_period_submissions
                FROM assessment_submissions s
                JOIN assessments a ON s.assessment_id = a.id
                JOIN users u ON s.student_id = u.id
                WHERE s.assessment_id = ?
            `;
            
            const params = [assessmentId];
            
            if (batchId) {
                query += ' AND u.batch_id = ?';
                params.push(batchId);
            }
            
            if (departmentId) {
                query += ' AND u.department_id = ?';
                params.push(departmentId);
            }
            
            if (dateFrom) {
                query += ' AND s.submitted_at >= ?';
                params.push(dateFrom);
            }
            
            if (dateTo) {
                query += ' AND s.submitted_at <= ?';
                params.push(dateTo);
            }
            
            const [results] = await db.query(query, params);
            const stats = results[0];
            
            return {
                success: true,
                statistics: {
                    totalSubmissions: stats.total_submissions,
                    lateSubmissions: stats.late_submissions,
                    onTimeSubmissions: stats.total_submissions - stats.late_submissions,
                    lateSubmissionRate: stats.total_submissions > 0 ? 
                        (stats.late_submissions / stats.total_submissions) * 100 : 0,
                    averageMinutesLate: stats.avg_minutes_late || 0,
                    averagePenalty: stats.avg_penalty || 0,
                    gracePeriodSubmissions: stats.grace_period_submissions
                }
            };
        } catch (error) {
            console.error('Error getting late submission stats:', error);
            throw error;
        }
    }

    // Get late submission details
    async getLateSubmissionDetails(assessmentId, filters = {}) {
        try {
            const { batchId, departmentId, dateFrom, dateTo, limit = 50, offset = 0 } = filters;
            
            let query = `
                SELECT 
                    s.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.roll_number,
                    b.name as batch_name,
                    d.name as department_name,
                    a.scheduling,
                    a.grace_period_minutes
                FROM assessment_submissions s
                JOIN users u ON s.student_id = u.id
                LEFT JOIN batches b ON u.batch_id = b.id
                LEFT JOIN departments d ON u.department_id = d.id
                JOIN assessments a ON s.assessment_id = a.id
                WHERE s.assessment_id = ? AND s.penalty_applied = TRUE
            `;
            
            const params = [assessmentId];
            
            if (batchId) {
                query += ' AND u.batch_id = ?';
                params.push(batchId);
            }
            
            if (departmentId) {
                query += ' AND u.department_id = ?';
                params.push(departmentId);
            }
            
            if (dateFrom) {
                query += ' AND s.submitted_at >= ?';
                params.push(dateFrom);
            }
            
            if (dateTo) {
                query += ' AND s.submitted_at <= ?';
                params.push(dateTo);
            }
            
            query += ' ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const [results] = await db.query(query, params);
            
            return {
                success: true,
                lateSubmissions: results,
                count: results.length
            };
        } catch (error) {
            console.error('Error getting late submission details:', error);
            throw error;
        }
    }

    // Update late submission policy
    async updateLateSubmissionPolicy(assessmentId, policy) {
        try {
            const query = `
                UPDATE assessments 
                SET 
                    late_submission_policy = ?,
                    grace_period_minutes = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            await db.query(query, [
                JSON.stringify(policy),
                policy.gracePeriodMinutes || 0,
                assessmentId
            ]);
            
            return { success: true, message: 'Late submission policy updated' };
        } catch (error) {
            console.error('Error updating late submission policy:', error);
            throw error;
        }
    }

    // Get late submission policy
    async getLateSubmissionPolicy(assessmentId) {
        try {
            const query = `
                SELECT 
                    late_submission_policy,
                    grace_period_minutes
                FROM assessments 
                WHERE id = ? AND is_active = TRUE
            `;
            const [results] = await db.query(query, [assessmentId]);
            
            if (results.length === 0) {
                return { success: false, message: 'Assessment not found' };
            }
            
            const assessment = results[0];
            const policy = JSON.parse(assessment.late_submission_policy || '{}');
            
            return {
                success: true,
                policy: {
                    ...policy,
                    gracePeriodMinutes: assessment.grace_period_minutes || 0
                }
            };
        } catch (error) {
            console.error('Error getting late submission policy:', error);
            throw error;
        }
    }

    // Process late submissions for an assessment
    async processLateSubmissions(assessmentId) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.score,
                    s.submitted_at,
                    a.scheduling,
                    a.late_submission_policy,
                    a.grace_period_minutes
                FROM assessment_submissions s
                JOIN assessments a ON s.assessment_id = a.id
                WHERE s.assessment_id = ? AND s.penalty_applied = FALSE
            `;
            const [results] = await db.query(query, [assessmentId]);
            
            let processedCount = 0;
            const results_data = [];
            
            for (const submission of results) {
                const lateCheck = await this.checkLateSubmission(assessmentId, submission.submitted_at);
                
                if (lateCheck.isLate) {
                    const penaltyResult = await this.applyLatePenalty(
                        submission.id, 
                        submission.score, 
                        submission.score // Assuming total points equals score for now
                    );
                    
                    if (penaltyResult.success) {
                        processedCount++;
                        results_data.push({
                            submissionId: submission.id,
                            originalScore: penaltyResult.originalScore,
                            finalScore: penaltyResult.finalScore,
                            penalty: penaltyResult.penalty,
                            minutesLate: penaltyResult.minutesLate
                        });
                    }
                }
            }
            
            return {
                success: true,
                processedCount,
                results: results_data
            };
        } catch (error) {
            console.error('Error processing late submissions:', error);
            throw error;
        }
    }

    // Get grace period information
    async getGracePeriodInfo(assessmentId) {
        try {
            const query = `
                SELECT 
                    scheduling,
                    grace_period_minutes,
                    late_submission_policy
                FROM assessments 
                WHERE id = ? AND is_active = TRUE
            `;
            const [results] = await db.query(query, [assessmentId]);
            
            if (results.length === 0) {
                return { success: false, message: 'Assessment not found' };
            }
            
            const assessment = results[0];
            const scheduling = JSON.parse(assessment.scheduling || '{}');
            const gracePeriod = assessment.grace_period_minutes || 0;
            const policy = JSON.parse(assessment.late_submission_policy || '{}');
            
            const deadline = new Date(scheduling.end_date);
            const graceDeadline = new Date(deadline.getTime() + (gracePeriod * 60 * 1000));
            
            return {
                success: true,
                gracePeriod: {
                    minutes: gracePeriod,
                    deadline: graceDeadline,
                    policy: policy,
                    allowsLateSubmission: policy.penaltyType !== 'none'
                }
            };
        } catch (error) {
            console.error('Error getting grace period info:', error);
            throw error;
        }
    }
}

export default new LateSubmissionService();
