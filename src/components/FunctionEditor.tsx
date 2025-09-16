import { useState } from 'react';

interface FunctionEditorProps {
  initialCode?: string
  onSave: (code: string) => void
  onCancel: () => void,
}

export const FunctionEditor = ({
  initialCode = '',
  onSave,
  onCancel,
}: FunctionEditorProps) => {
  const [code, setCode] = useState(initialCode);
  return (
    <div className="flex flex-col h-full w-full">
      <textarea
        className="flex-1 w-full border rounded p-2 font-mono text-sm"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`// JS function body. Example:\nreturn Math.random() * 2;`}
      />
      <div className="mt-2 flex gap-2 justify-end">
        <button className="px-3 py-1 text-sm bg-gray-200 rounded" onClick={onCancel}>Cancel</button>
        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => {
          onSave(code);
        }}>
          Save
        </button>
      </div>
    </div>
  )
}

export default FunctionEditor;
