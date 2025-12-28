// FormDebugger component
// Add this to components/ui/formDebugger.tsx

import { useEffect } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface FormDebuggerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  showInProduction?: boolean;
}

const FormDebugger = <T extends FieldValues>({
  form,
  showInProduction = false,
}: FormDebuggerProps<T>) => {
  // Watch all form values
  const values = form.watch();
  const { errors, isDirty, isValid, isSubmitting, isSubmitted } =
    form.formState;

  // Don't render in production unless explicitly specified
  if (process.env.NODE_ENV === "production" && !showInProduction) {
    return null;
  }

  return (
    <div className='p-4 my-4 border border-gray-300 rounded-md bg-gray-50'>
      <h3 className='font-bold text-sm mb-2'>Form Debug Info</h3>
      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div>
          <h4 className='font-semibold'>Values:</h4>
          <pre className='mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto'>
            {JSON.stringify(values, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className='font-semibold'>Errors:</h4>
          <pre className='mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto'>
            {JSON.stringify(errors, null, 2)}
          </pre>
        </div>
      </div>
      <div className='mt-2 text-xs'>
        <h4 className='font-semibold'>State:</h4>
        <div className='flex gap-4 mt-1'>
          <div
            className={`p-1 rounded ${isDirty ? "bg-green-100" : "bg-red-100"}`}
          >
            isDirty: {isDirty ? "Yes" : "No"}
          </div>
          <div
            className={`p-1 rounded ${isValid ? "bg-green-100" : "bg-red-100"}`}
          >
            isValid: {isValid ? "Yes" : "No"}
          </div>
          <div
            className={`p-1 rounded ${isSubmitting ? "bg-yellow-100" : "bg-green-100"}`}
          >
            isSubmitting: {isSubmitting ? "Yes" : "No"}
          </div>
          <div
            className={`p-1 rounded ${isSubmitted ? "bg-green-100" : "bg-gray-100"}`}
          >
            isSubmitted: {isSubmitted ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormDebugger;
