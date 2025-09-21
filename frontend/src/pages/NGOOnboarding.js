import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Clock, 
  CheckCircle, 
  Upload,
  AlertCircle,
  Heart
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const NGOOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    organizationName: '',
    registrationNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    establishedYear: '',
    description: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    
    // Operational Information
    focusAreas: [],
    acceptedCategories: [],
    capacityLimit: 50,
    operatingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  });
  
  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    taxExemptionCertificate: null,
    addressProof: null
  });
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredNGOId, setRegisteredNGOId] = useState('');

  const focusAreaOptions = [
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'poverty', name: 'Poverty Alleviation', icon: '🤝' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'women', name: 'Women Empowerment', icon: '👩' },
    { id: 'children', name: 'Child Welfare', icon: '👶' },
    { id: 'elderly', name: 'Elderly Care', icon: '👴' },
    { id: 'disability', name: 'Disability Support', icon: '♿' },
    { id: 'community', name: 'Community Development', icon: '🏘️' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/v1/ngo/categories');
      setAvailableCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setAvailableCategories([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileUpload = (documentType, file) => {
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
    } else {
      toast.error('File size must be less than 5MB');
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.organizationName && formData.registrationNumber && 
               formData.contactPerson && formData.email && formData.phone;
      case 2:
        return formData.address && formData.city && formData.state && formData.pincode;
      case 3:
        return formData.focusAreas.length > 0 && formData.acceptedCategories.length > 0;
      case 4:
        return true; // Step 4 is now optional - documents can be uploaded later
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitRegistration = async () => {
    // Validate previous steps (1-3) but make documents optional
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please complete all required fields in previous steps');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSubmit = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object') {
          formDataToSubmit.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSubmit.append(key, formData[key]);
        }
      });
      
      // Append documents
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          formDataToSubmit.append(key, documents[key]);
        }
      });

      const response = await api.post('/api/v1/ngo/register', formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setRegisteredNGOId(response.data.ngo.ngoId);
        setRegistrationComplete(true);
        toast.success('Registration submitted successfully!');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your NGO application has been submitted successfully. Our team will review your application within 3-5 business days.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Your NGO ID:</p>
            <p className="font-mono text-lg font-bold text-green-600">{registeredNGOId}</p>
          </div>
          <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll receive an email confirmation shortly</li>
              <li>• Our verification team will review your documents</li>
              <li>• You'll be notified once verification is complete</li>
              <li>• Once verified, you can start receiving donations</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">NGO Registration</h1>
                <p className="text-sm text-gray-600">Join Meesho Rebound's donation network</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Step {currentStep} of 5</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Building className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your NGO name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Government registration number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Primary contact person"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="contact@ngo.org"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://www.ngo.org"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Brief description of your organization's mission and activities"
                />
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Complete address with landmarks"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="State"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="123456"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="12.9716"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="77.5946"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Location coordinates help us:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 mt-1 ml-4">
                        <li>• Match you with nearby donors</li>
                        <li>• Optimize donation delivery routes</li>
                        <li>• Provide better service to your community</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Operational Information */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Operational Information</h2>
              </div>
              
              <div className="space-y-8">
                {/* Focus Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Focus Areas <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {focusAreaOptions.map((area) => (
                      <div
                        key={area.id}
                        onClick={() => handleArrayToggle('focusAreas', area.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.focusAreas.includes(area.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{area.icon}</span>
                          <span className="text-sm font-medium">{area.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accepted Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Product Categories You Accept <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableCategories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleArrayToggle('acceptedCategories', category.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                          formData.acceptedCategories.includes(category.id)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{category.icon}</div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capacity Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Donation Capacity (Items)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={formData.capacityLimit}
                      onChange={(e) => handleInputChange('capacityLimit', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-orange-100 px-4 py-2 rounded-lg">
                      <span className="font-bold text-orange-700">{formData.capacityLimit} items/month</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Estimate how many donated items you can handle per month
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Operating Hours */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Operating Hours</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(formData.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-24">
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Open</span>
                    </div>
                    
                    {!hours.closed && (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">From:</span>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                            className="p-2 border border-gray-300 rounded"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">To:</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                            className="p-2 border border-gray-300 rounded"
                          />
                        </div>
                      </>
                    )}
                    
                    {hours.closed && (
                      <span className="text-gray-500 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Document Upload */}
          {currentStep === 5 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="h-6 w-6 text-orange-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
                  <p className="text-sm text-gray-600">Optional - You can upload documents later for faster verification</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Registration Certificate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Certificate <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {documents.registrationCertificate ? documents.registrationCertificate.name : 'Upload Registration Certificate'}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('registrationCertificate', e.target.files[0])}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Exemption Certificate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Exemption Certificate (12A/80G) <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {documents.taxExemptionCertificate ? documents.taxExemptionCertificate.name : 'Upload Tax Exemption Certificate'}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('taxExemptionCertificate', e.target.files[0])}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Proof (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {documents.addressProof ? documents.addressProof.name : 'Upload Address Proof'}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('addressProof', e.target.files[0])}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Document Upload Information:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 mt-1 ml-4">
                        <li>• Documents are optional but recommended for faster verification</li>
                        <li>• You can upload documents later through your NGO dashboard</li>
                        <li>• Verified NGOs with documents get priority in donation matching</li>
                        <li>• All documents will be reviewed within 3-5 business days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={submitRegistration}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NGOOnboarding;