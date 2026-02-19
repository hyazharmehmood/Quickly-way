'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LocationAutocomplete from '@/components/ui/LocationAutocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_CODES } from '@/utils/constants';
import { toast } from 'sonner';

const PostServiceProfile = ({ 
    user, 
    profileImage, setProfileImage,
    name, setName,
    email,
    phoneCountryCode, setPhoneCountryCode,
    phoneNumber, setPhoneNumber,
    showEmail, setShowEmail,
    showMobile, setShowMobile,
    yearsOfExperience, setYearsOfExperience,
    location, setLocation,
    onNext, onCancel
}) => {
    const profileInputRef = useRef(null);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    // Compress image helper
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIMENSION = 800;

                    if (width > height) {
                        if (width > MAX_DIMENSION) {
                            height = (height * MAX_DIMENSION) / width;
                            width = MAX_DIMENSION;
                        }
                    } else {
                        if (height > MAX_DIMENSION) {
                            width = (width * MAX_DIMENSION) / height;
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = () => resolve(event.target?.result);
            };
            reader.onerror = () => resolve(null);
        });
    };

    const handleProfileImageUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressedUrl = await compressImage(file);
                if (compressedUrl) {
                    setProfileImage(compressedUrl);
                } else {
                    setProfileImage(URL.createObjectURL(file));
                }
            } catch (error) {
                setProfileImage(URL.createObjectURL(file));
            }
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`
                    );
                    const data = await res.json();

                    if (data.success && data.location) {
                        setLocation(data.location);
                        toast.success('Location detected');
                    } else {
                        const message = data.error || 'Could not detect location';
                        toast.error(message);
                    }
                } catch (error) {
                    console.error('Geocode error:', error);
                    toast.error('Failed to detect location');
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                const message = error.code === 1
                    ? 'Location permission denied. Allow access or enter manually.'
                    : 'Could not detect your location. Try again or enter manually.';
                toast.error(message);
                setIsDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleNext = () => {
        // Validate required fields
        if (!name || name.trim().length === 0) {
            toast.error('Please enter your name');
            return;
        }
        if (name.length > 20) {
            toast.error('Name must be 20 characters or less');
            return;
        }
        if (!yearsOfExperience || yearsOfExperience < 0) {
            toast.error('Please enter years of experience (0 or more)');
            return;
        }
        if (!location || location.trim().length === 0) {
            toast.error('Please enter your location');
            return;
        }
        if (location.length > 50) {
            toast.error('Location must be 50 characters or less');
            return;
        }
        onNext();
    };

    // Initialize phone country code from existing phoneNumber if it starts with +
    useEffect(() => {
        if (phoneNumber && phoneNumber.startsWith('+') && !phoneCountryCode) {
            const match = phoneNumber.match(/^(\+\d{1,4})/);
            if (match) {
                const code = match[1];
                const country = COUNTRY_CODES.find(c => c.dial_code === code);
                if (country) {
                    setPhoneCountryCode(country.dial_code);
                    setPhoneNumber(phoneNumber.replace(code, '').trim());
                }
            }
        }
    }, [phoneNumber, phoneCountryCode, setPhoneCountryCode, setPhoneNumber]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">User Profile</h2>
                <p className="text-sm text-muted-foreground">
                    Complete your profile details. This information will be saved to your profile.
                </p>
            </div>

            <Card className="border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-normal flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Picture - full width */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <input
                            type="file"
                            ref={profileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                        />
                        <div className="relative group/image">
                            <div
                                onClick={() => profileInputRef.current?.click()}
                                className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary bg-secondary cursor-pointer hover:opacity-90 transition-opacity relative shadow-sm"
                            >
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <User className="w-12 h-12 mb-2 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            {profileImage && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setProfileImage(null)}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-md"
                                    title="Remove photo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Upload picture</p>
                    </div>

                    {/* Two columns: Name | Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => {
                                    const val = e.target.value.slice(0, 20);
                                    setName(val);
                                }}
                                placeholder="Display name"
                                className="w-full"
                                maxLength={20}
                            />
                            <p className="text-xs text-muted-foreground">{name.length}/20</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Label className="flex items-center gap-2 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showEmail}
                                        onChange={(e) => setShowEmail(e.target.checked)}
                                        className="w-4 h-4 rounded border-input accent-primary focus:ring-primary"
                                    />
                                    Show my email to client
                                </Label>
                            </div>
                            <Input
                                id="email"
                                type="email"
                                value={email || ''}
                                disabled
                                placeholder="Display email"
                                className="w-full disabled:opacity-100 disabled:cursor-not-allowed"
                                maxLength={50}
                            />
                            <p className="text-xs text-muted-foreground">{email?.length || 0}/50</p>
                        </div>
                    </div>

                    {/* Two columns: Phone | Years of Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <Label htmlFor="phone">Phone</Label>
                                <Label className="flex items-center gap-2 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showMobile}
                                        onChange={(e) => setShowMobile(e.target.checked)}
                                        className="w-4 h-4 rounded border-input accent-primary focus:ring-primary"
                                    />
                                    Show my phone to client
                                </Label>
                            </div>
                            <div className="flex gap-2">
                               
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="flex-1 min-w-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">
                                Years of experience <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="experience"
                                type="number"
                                placeholder="e.g. 1"
                                value={yearsOfExperience || ''}
                                onChange={(e) => setYearsOfExperience(e.target.value)}
                                min="0"
                                className="w-full"
                            
                            />
                        </div>
                    </div>

                    {/* Location - two columns: green Detect button | manual input */}
                    <div className="space-y-2">
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-2">
                            <Label htmlFor="location" className="text-foreground font-medium">
                            Location <span className="text-destructive">*</span>
                        </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDetectLocation}
                                    disabled={isDetectingLocation}
                                    className="w-full h-11 rounded-lg border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300 text-green-700 font-medium"
                                >
                                    <MapPin className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                                    {isDetectingLocation ? 'Detecting...' : 'Detect my location'}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-normal text-foreground">Or enter location manually</p>
                                <LocationAutocomplete
                                    value={location}
                                    onChange={setLocation}
                                    placeholder="Al Khobar, Saudi Arabia"
                                    maxLength={50}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                        Cancel
                    </Button>
                )}
                <Button type="button" onClick={handleNext} className="flex-1">
                    Next Step
                </Button>
            </div>
        </div>
    );
};

export default PostServiceProfile;
