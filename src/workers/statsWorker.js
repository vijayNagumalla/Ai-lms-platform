// Web Worker for background platform statistics fetching
// This worker handles the heavy lifting of fetching platform statistics
// without blocking the main UI thread

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'FETCH_STATS':
      handleFetchStats(data);
      break;
    case 'BATCH_FETCH_STATS':
      handleBatchFetchStats(data);
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

async function handleFetchStats({ studentId, apiUrl, token }) {
  try {
    const response = await fetch(`${apiUrl}/coding-profiles/student/${studentId}/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    self.postMessage({
      type: 'STATS_FETCHED',
      data: {
        studentId,
        success: result.success,
        stats: result.data?.platformStatistics || null,
        error: result.success ? null : result.message
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'STATS_FETCHED',
      data: {
        studentId,
        success: false,
        stats: null,
        error: error.message
      }
    });
  }
}

async function handleBatchFetchStats({ studentIds, apiUrl, token, batchSize = 5 }) {
  const results = {};
  const errors = {};
  
  try {
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      
      // Send batch request to the API
      const response = await fetch(`${apiUrl}/coding-profiles/students/batch-statistics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: batch })
      });
      
      const result = await response.json();
      
      if (result.success) {
        Object.assign(results, result.data.results);
      } else {
        // Mark all students in this batch as failed
        batch.forEach(id => {
          errors[id] = result.message || 'Failed to fetch statistics';
        });
      }
      
      // Small delay between batches
      if (i + batchSize < studentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
      }
      
      // Send progress update
      self.postMessage({
        type: 'BATCH_PROGRESS',
        data: {
          processed: Math.min(i + batchSize, studentIds.length),
          total: studentIds.length,
          results: { ...results },
          errors: { ...errors }
        }
      });
    }
    
    // Send final results
    self.postMessage({
      type: 'BATCH_COMPLETE',
      data: {
        results,
        errors,
        totalProcessed: studentIds.length
      }
    });
    
  } catch (error) {
    self.postMessage({
      type: 'BATCH_ERROR',
      data: {
        error: error.message,
        results,
        errors
      }
    });
  }
}

// Handle errors
self.onerror = function(error) {
  self.postMessage({
    type: 'WORKER_ERROR',
    data: {
      error: error.message
    }
  });
};
