import { toast } from 'react-toastify';


const baseConfig = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/* SUCCESS */
export const showSuccess = (message) =>
  toast.success(message, {
    ...baseConfig,
    className: 'bg-emerald-600 text-white',
  });

/* ERROR */
export const showError = (message) =>
  toast.error(message, {
    ...baseConfig,
    className: 'bg-red-600 text-white',
  });

/* WARNING */
export const showWarning = (message) =>
  toast.warn(message, {
    ...baseConfig,
    className: 'bg-amber-500 text-white',
  });

/* INFO */
export const showInfo = (message) =>
  toast.info(message, {
    ...baseConfig,
    className: 'bg-blue-600 text-white',
  });


export const showConfirm = (message, onConfirm) => {
  toast(
    ({ closeToast }) => (
      <div className="text-white">
        <p className="font-medium mb-3">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              onConfirm();
              closeToast();
            }}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>

          <button
            onClick={closeToast}
            className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      position: 'top-right',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      className: 'bg-slate-800',
    }
  );
};
