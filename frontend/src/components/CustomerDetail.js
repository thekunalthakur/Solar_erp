import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });
  const [isUploading, setIsUploading] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getCustomer(id);
      setCustomer(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer details');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setUploadForm((prev) => ({ ...prev, file: selectedFile }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('file', uploadForm.file);

      await api.uploadCustomerDocument(id, formData);
      setUploadForm({ title: '', file: null });
      fetchCustomer();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/customers')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Customers
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">{error}</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/customers')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Customers
        </button>
        <div className="text-center py-12 text-gray-500">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/customers')}
        className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
      >
        ← Back to Customers
      </button>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h1>
        <p className="text-lg text-blue-600 font-mono font-semibold mb-6">{customer.lead_id}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Customer Info</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <p className="text-lg text-gray-900">{customer.phone}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">City</label>
                <p className="text-lg text-gray-900">{customer.city}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Assigned To</label>
                <p className="text-lg text-gray-900">{customer.assigned_to_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Customer Since</label>
                <p className="text-lg text-gray-900">
                  {new Date(customer.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents</h2>

        <form onSubmit={handleUpload} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                id="doc-title"
                type="text"
                name="title"
                value={uploadForm.title}
                onChange={handleInputChange}
                placeholder="Document title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="doc-file" className="block text-sm font-medium text-gray-700 mb-2">File</label>
              <input
                id="doc-file"
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isUploading || !uploadForm.file}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Files ({customer.documents ? customer.documents.length : 0})
          </h3>
          {customer.documents && customer.documents.length > 0 ? (
            <div className="space-y-3">
              {customer.documents.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{doc.title || 'Untitled Document'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded by {doc.uploaded_by_name || 'Unknown'} on{' '}
                      {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
