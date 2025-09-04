import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Key, Edit3, Camera, Phone, Building, GraduationCap, Save, X, Eye, EyeOff, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { CountrySelect } from '@/components/ui/country-select';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar_url: '',
    department: '',
    student_id: '',
    country: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        department: user.department || '',
        student_id: user.student_id || '',
        country: user.country || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    // Validate phone (optional but if provided, must be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Validate student ID (optional but if provided, must be valid)
    if (formData.student_id && formData.student_id.trim().length < 3) {
      errors.student_id = 'Student ID must be at least 3 characters long';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordChange = () => {
    const errors = {};
    
    if (passwordData.newPassword || passwordData.confirmPassword || passwordData.currentPassword) {
      if (!passwordData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      
      if (!passwordData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters long';
      }
      
      if (!passwordData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
      } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form"
      });
      return;
    }

    if (passwordData.newPassword && !validatePasswordChange()) {
      toast({
        variant: "destructive",
        title: "Password Validation Error",
        description: "Please fix the password errors"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update profile
      const profileResponse = await apiService.updateProfile(formData);
      
      if (profileResponse.success) {
        // Update local user state
        updateUser(profileResponse.data);
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully"
        });
      }

      // Change password if provided
      if (passwordData.newPassword) {
        const passwordResponse = await apiService.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        
        if (passwordResponse.success) {
          toast({
            title: "Password Changed",
            description: "Your password has been changed successfully"
          });
          
          // Clear password fields
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      }

    setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
      department: user.department || '',
      student_id: user.student_id || ''
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setValidationErrors({});
  };
  
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'super-admin': 'Super Administrator',
      'college-admin': 'College Administrator',
      'faculty': 'Faculty Member',
      'student': 'Student'
    };
    return roleMap[role] || role;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
      <Card className="shadow-2xl glassmorphic">
        <CardHeader className="text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1}} 
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-32 h-32 mx-auto"
          >
            <Avatar className="w-32 h-32 mx-auto border-4 border-primary shadow-lg">
                  <AvatarImage src={formData.avatar_url || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
              <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <label htmlFor="avatarUpload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                <Camera size={18} />
                <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </motion.div>
              <CardTitle className="text-2xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                {user.name || 'User Profile'}
              </CardTitle>
              <CardDescription className="text-sm">{user.email}</CardDescription>
              <Badge variant="secondary" className="mt-2">
                {getRoleDisplayName(user.role)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <Card className="shadow-2xl glassmorphic">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {isEditing ? 'Edit Profile Information' : 'Profile Information'}
          </CardTitle>
              <CardDescription>
                {isEditing ? 'Update your personal information and settings' : 'View your profile information'}
              </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Basic Information
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
            <div>
                      <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                        className={`mt-1 ${validationErrors.name ? 'border-red-500' : ''}`}
                        placeholder="Enter your full name"
              />
                      {validationErrors.name && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                      )}
            </div>

            <div>
                      <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                        value={user.email}
                        disabled
                className="mt-1 bg-muted/50 cursor-not-allowed"
              />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                        <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`mt-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
                        placeholder="Enter your phone number"
                      />
                      {validationErrors.phone && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        name="department"
                        type="text"
                        value={formData.department}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your department"
                      />
                    </div>

                    {user.role === 'student' && (
                      <div>
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input
                          id="student_id"
                          name="student_id"
                          type="text"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`mt-1 ${validationErrors.student_id ? 'border-red-500' : ''}`}
                          placeholder="Enter your student ID"
                        />
                        {validationErrors.student_id && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.student_id}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <CountrySelect
                        value={formData.country}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, country: value }));
                          if (validationErrors.country) {
                            setValidationErrors(prev => ({ ...prev, country: '' }));
                          }
                        }}
                        placeholder="Select your country"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Used for timezone calculations in assessments</p>
                      {validationErrors.country && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.country}</p>
                      )}
                    </div>
                    </div>
                </div>

                {/* Password Change Section */}
                {isEditing && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Leave password fields blank if you don't want to change your password
                      </p>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`mt-1 ${validationErrors.currentPassword ? 'border-red-500' : ''}`}
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {validationErrors.currentPassword && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.currentPassword}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`mt-1 ${validationErrors.newPassword ? 'border-red-500' : ''}`}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {validationErrors.newPassword && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.newPassword}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`mt-1 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                              placeholder="Confirm new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                  </div>
                          {validationErrors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                )}
                        </div>
                      </div>
                    </div>
              </>
            )}
            
                {/* Action Buttons */}
                {isEditing && (
            <CardFooter className="flex justify-end gap-3 p-0 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                </>
              ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                </Button>
                  </CardFooter>
              )}
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProfilePage;
