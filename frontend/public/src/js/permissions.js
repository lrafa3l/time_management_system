// Função central de verificação
export async function verifyPermission(requiredRole, customCheck) {
    const user = auth.currentUser;
    const userDoc = await db.collection("users").doc(user.uid).get();
    
    if (!userDoc.exists) throw new Error("Perfil não encontrado");
    
    const userData = userDoc.data();
    const isAdmin = userData.role === 'admin';
    
    if (userData.role !== requiredRole && !isAdmin) {
      throw new Error("Acesso não autorizado");
    }
    
    if (customCheck && !customCheck(userData)) {
      throw new Error("Restrição adicional não satisfeita");
    }
    
    return { user, userData }; // Retorna dados para uso posterior
  }
  
  // Exemplo: Função protegida para deletar
  export async function protectedDelete(collection, docId) {
    const { user } = await verifyPermission('admin');
    
    await db.collection(collection).doc(docId).delete();
    console.log(`Documento ${docId} deletado por ${user.email}`);
  }
