import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_DIMENSIONS = { width: 200, height: 200 };
const MAX_DIMENSIONS = { width: 2048, height: 2048 };

const ImageUpload = ({ 
  currentImageUrl, 
  onImageSelected, 
  label, 
  className = "" 
}) => {
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        reject('File must be JPEG, PNG, or WebP');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        reject('File size must be less than 5MB');
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < MIN_DIMENSIONS.width || img.height < MIN_DIMENSIONS.height) {
          reject(`Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px`);
          return;
        }
        if (img.width > MAX_DIMENSIONS.width || img.height > MAX_DIMENSIONS.height) {
          reject(`Image must be no larger than ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px`);
          return;
        }
        resolve(file);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject('Invalid image file');
      };
    });
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${localStorage.getItem('credentials')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw new Error('Failed to upload image');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      await validateImage(file);
      const url = await uploadImage(file);
      setPreview(url);
      onImageSelected(url);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageSelected('');
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="mt-1 flex items-center space-x-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="h-16 w-16 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}
        
        <label className="relative cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </span>
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        JPEG, PNG, or WebP. 200x200px to 2048x2048px. Max 5MB.
      </p>
    </div>
  );
};

export default ImageUpload; 