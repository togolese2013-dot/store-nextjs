import ImportExportManager from "@/components/admin/ImportExportManager";

export default function ImportExportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-800 text-slate-900 mb-2">
            Import / Export Produits
          </h1>
          <p className="text-slate-600">
            Importez ou exportez vos produits en masse via des fichiers CSV
          </p>
        </div>

        <ImportExportManager />
      </div>
    </div>
  );
}