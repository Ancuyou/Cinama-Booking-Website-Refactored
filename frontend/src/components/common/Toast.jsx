import React, { useState, useEffect, createContext, useContext } from 'react';

// Create context for toast notifications
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
};

// Hook to use toast anywhere in the app
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Function to add a new toast
    const showToast = (message, type = TOAST_TYPES.INFO, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
        return id;
    };

    // Shorthand functions
    const showSuccess = (message, duration) => showToast(message, TOAST_TYPES.SUCCESS, duration);
    const showError = (message, duration) => showToast(message, TOAST_TYPES.ERROR, duration);
    const showInfo = (message, duration) => showToast(message, TOAST_TYPES.INFO, duration);
    const showWarning = (message, duration) => showToast(message, TOAST_TYPES.WARNING, duration);

    // Function to remove a toast
    const removeToast = (id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container position-fixed top-0 end-0 p-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

const Toast = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast, removeToast]);

    // Define icon and class based on type
    const getToastProps = () => {
        switch (toast.type) {
            case TOAST_TYPES.SUCCESS:
                return {
                    icon: 'bi-check-circle-fill',
                    className: 'bg-success text-white'
                };
            case TOAST_TYPES.ERROR:
                return {
                    icon: 'bi-exclamation-circle-fill',
                    className: 'bg-danger text-white'
                };
            case TOAST_TYPES.WARNING:
                return {
                    icon: 'bi-exclamation-triangle-fill',
                    className: 'bg-warning text-dark'
                };
            case TOAST_TYPES.INFO:
            default:
                return {
                    icon: 'bi-info-circle-fill',
                    className: 'bg-info text-white'
                };
        }
    };

    const { icon, className } = getToastProps();

    return (
        <div
            className={`toast show ${className}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <div className="toast-header">
                <i className={`bi ${icon} me-2`}></i>
                <strong className="me-auto">
                    {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
                </strong>
                <button
                    type="button"
                    className="btn-close"
                    onClick={() => removeToast(toast.id)}
                    aria-label="Close"
                ></button>
            </div>
            <div className="toast-body">
                {toast.message}
            </div>
        </div>
    );
};

export default ToastProvider;