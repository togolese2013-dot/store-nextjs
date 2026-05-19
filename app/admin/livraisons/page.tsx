import LivraisonsManager from "@/components/admin/LivraisonsManagerClient";

export default function LivraisonsPage() {
  return (
    <LivraisonsManager
      initialLivraisons={[]}
      initialTotal={0}
      initialLivreurs={[]}
      initialStats={{ total: 0, en_attente: 0, en_cours: 0, livre: 0 }}
    />
  );
}
