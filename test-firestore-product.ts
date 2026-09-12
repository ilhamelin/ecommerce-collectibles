import { getProductsFromFirestore, getProductByIdOrSkuFromFirestore } from "./src/lib/firebase/firestore";

async function main() {
  console.log("Testing Firestore product retrieval...");
  const products = await getProductsFromFirestore();
  console.log("Total products in Firestore:", products?.length);
  if (products) {
    products.forEach(p => console.log(`- ${p.id}: ${p.name} (${p.sku})`));
  }

  const p = await getProductByIdOrSkuFromFirestore("prod-1789159614996-3dub");
  console.log("Looked up 'prod-1789159614996-3dub':", p ? p.name : "NOT FOUND");
}

main().catch(console.error);
