const listeners = new Set();

export function subscribeToast(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function emit(toastData) {
    listeners.forEach((listener) => listener(toastData));
}

export const toast = {
    success: (title, desc) => emit({type: "success", title, desc}),
    danger: (title, desc) => emit({type: "danger", title, desc}),
    warning: (title, desc) => emit({type: "warning", title, desc}),
    info: (title, desc) => emit({type: "info", title, desc}),
};
