import { useState } from 'react';
import { User, Lock, Phone, Save, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { Card, Button, Input, PageHeader } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';
import { auth } from '../lib/firebase';

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function Settings() {
  const { success, error: toastError } = useToast();
  const { user, updateUser } = useAuthStore();

  // Detect if signed in via Google (Firebase) — hide password change for OAuth users
  const isGoogleUser = auth.currentUser?.providerData?.some(p => p.providerId === 'google.com') ?? false;

  // Profile Details Form State
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Change Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const allMet = requirements.every((r) => r.test(passwords.newPassword));
  const passwordsMatch = passwords.newPassword === passwords.confirm;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      toastError('First name and last name are required');
      return;
    }
    setProfileLoading(true);
    try {
      const response = await api.put('/auth/profile', profile);
      updateUser(response.data.user);
      success('Profile updated successfully!');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      setPwdError('Current password is required');
      return;
    }
    if (!allMet) {
      setPwdError('New password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdError('');
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up py-4">
      <PageHeader title="Settings" description="Manage your profile details and security settings." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile details */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Profile Details</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="First Name"
              required
              value={profile.firstName}
              onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="First name"
            />
            <Input
              label="Last Name"
              required
              value={profile.lastName}
              onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Last name"
            />
            <Input
              label="Phone Number"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone number"
              type="tel"
              icon={<Phone className="w-4 h-4 text-surface-400" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={profileLoading}
              icon={<Save className="w-4 h-4" />}
            >
              Save Details
            </Button>
          </form>
        </Card>

        {/* Change password */}
        {isGoogleUser ? (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-surface-900">Security</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-8 h-8" />
              <p className="text-sm font-semibold text-surface-800">Signed in with Google</p>
              <p className="text-sm text-surface-500">
                Your password is managed by your Google Account. To change it, visit your
                <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-primary-600 underline ml-1">Google Account settings</a>.
              </p>
            </div>
          </Card>
        ) : (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-50 text-accent-600">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Change Password</h3>
          </div>

          {pwdError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{pwdError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="form-input !pl-11 !pr-10"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  className="form-input !pl-11 !pr-10"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requirements */}
            {passwords.newPassword && (
              <div className="bg-surface-50 rounded-xl p-4 space-y-2">
                {requirements.map((r) => {
                  const met = r.test(passwords.newPassword);
                  return (
                    <div key={r.label} className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${met ? 'text-green-500' : 'text-surface-300'}`} />
                      <span className={`text-xs ${met ? 'text-green-700' : 'text-surface-500'}`}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  className={`form-input !pl-11 !pr-10 ${
                    passwords.confirm && !passwordsMatch ? 'border-red-400' : ''
                  }`}
                  placeholder="Repeat new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwords.confirm && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={passwordLoading}
              disabled={!allMet || !passwordsMatch}
            >
              Update Password
            </Button>
          </form>
        </Card>
        )}

      </div>
    </div>
  );
}
