import { exportToFile } from "../../utils/codec.v1";

export type ExportDialogProps = {
  graphData: any; // we'll export this :)
  closeDialog?: Function;
}


export const ExportDialog: React.FC<ExportDialogProps> = ({ graphData }) => {
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onExportJson = () => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'export.json');
  };

  const onExportPng = async () => {
    alert('PNG export is not yet implemented. Please use your browser\'s screenshot feature as a workaround.');
  };

  const onExportRck = async () => {
    const file = await exportToFile(graphData, 'export-rck.rck');
    downloadBlob(file, 'export-rck.rck');
  };

  const nodeCount = Array.isArray(graphData?.nodes) ? graphData.nodes.length : 0;
  const edgeCount = Array.isArray(graphData?.edges) ? graphData.edges.length : 0;

  return (
    <div className="p-4">
      <div className="max-w-xl mx-auto my-auto">
        <div className="flex items-center">
          <div>
            <h3 className="text-lg font-semibold py-2">Export</h3>
            <p className="text-sm m-0">Download your project as .rck, .json, or .png (not yet implemented)</p>
          </div>
        </div>
        <div>
          <div className="flex items-center flex-start mb-4 gap-2 py-2">
            <div className="text-sm font-medium">{nodeCount} nodes</div>
            <div className="text-sm text-gray-500">{edgeCount} edges</div>
          </div>

          <div className="flex gap-x-2 py-2">
            <button
              onClick={onExportRck}
              className="btn btn-primary"
            >
              Export .rck
            </button>
            <button
              onClick={onExportJson}
              className="btn btn-secondary bg-blue-300 hover:bg-blue-800 hover:text-white"
            >
              Export .json
            </button>
            <button
              onClick={onExportPng}
              className="btn btn-disabled"
            >
              Export .png
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
