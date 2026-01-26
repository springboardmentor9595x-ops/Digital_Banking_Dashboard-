import { useState } from 'react';
import { uploadTransactionsCSV } from '../api';
import { showSuccess, showError } from '../utils/toast';

function UploadCSVModal({ isOpen, onClose, accountId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      showError('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      const res = await uploadTransactionsCSV(accountId, file);
      showSuccess(res.message || 'CSV uploaded');
      onUploadSuccess();   //  refresh dashboard
      onClose();

      setFile(null);
    } catch (err) {
      console.error(err);
      showError('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Transactions CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            className="px-4 py-2 rounded bg-indigo-600 text-white"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadCSVModal;
