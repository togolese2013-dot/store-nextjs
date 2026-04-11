import { getProducts } from "@/lib/db";

export default async function TestPage() {
  const products = await getProducts({ limit: 5 });
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">Nombre de produits: {products.length}</p>
      
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="p-4 border rounded">
            <h2 className="font-bold">{product.nom}</h2>
            <p>ID: {product.id}</p>
            <p>Images: {JSON.stringify(product.images)}</p>
            <p>Image URL: {product.image_url || "null"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}