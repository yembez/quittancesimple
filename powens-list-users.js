const POWENS_API_URL = "https://quittancesimple-sandbox.biapi.pro";

// Tokens permanents récupérés depuis votre base de données Supabase
const PERMANENT_TOKENS = [
  "xsbVa2D01gpjBIAuPhHDzCEHWSbrpeK_yIg6q2r4Akex4kxOtwUbQgXE/Hr13RFkoS7k5H5anUHkH8izUO3be5o9qITr4bpbFW7TMBtD0C/YSOz2V6IZtkdCgJvV_uGd",
  "gxkUQtQnvrErlOUkB0UAj9hcbieZlNMI0wpYyw8Bbe14qlciImSgZ4JVEI7rzmrFzhDlu_wE7d3DngDs3wBa0qNnDyI6Tt/pYwZYtJl3kYt0rqkBgbA79TwjEwiobMY1"
];

async function getUserInfo(token) {
  console.log(`\n🔍 Fetching user info with token ${token.substring(0, 20)}...`);

  try {
    const response = await fetch(`${POWENS_API_URL}/2.0/users/me`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log(`📡 Status: ${response.status}`);

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Error ${response.status}:`, responseText.substring(0, 300));
      return null;
    }

    const userData = JSON.parse(responseText);
    console.log(`✅ User found:`, JSON.stringify(userData, null, 2));

    return userData;

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function getConnections(token) {
  console.log(`\n🔗 Fetching connections...`);

  try {
    const response = await fetch(`${POWENS_API_URL}/2.0/users/me/connections?expand=connector,bank`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`❌ Error fetching connections: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Connections:`, JSON.stringify(data, null, 2));
    return data;

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function getDeletedConnections(token) {
  console.log(`\n🗑️  Fetching deleted connections (historical data)...`);

  try {
    const response = await fetch(`${POWENS_API_URL}/2.0/users/me/connections/logs?limit=100`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.log(`   ℹ️  No logs endpoint available (${response.status})`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Connection logs:`, JSON.stringify(data, null, 2));
    return data;

  } catch (error) {
    console.log(`   ℹ️  Logs not available`);
    return null;
  }
}

async function deleteUser(token, userId) {
  console.log(`\n🗑️  Deleting user ${userId}...`);

  const confirmation = "yes"; // Changez en "yes" pour activer la suppression

  if (confirmation !== "yes") {
    console.log(`⚠️  Suppression désactivée. Changez 'confirmation' en "yes" pour activer.`);
    return false;
  }

  try {
    const response = await fetch(`${POWENS_API_URL}/2.0/users/me`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to delete: ${response.status}`, errorText.substring(0, 300));
      return false;
    }

    console.log(`✅ User ${userId} deleted successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log("=" .repeat(70));
  console.log("🔍 POWENS SANDBOX - GESTION DES UTILISATEURS");
  console.log("=" .repeat(70));

  console.log(`\n📊 Nombre de tokens à vérifier: ${PERMANENT_TOKENS.length}\n`);

  const users = [];

  // ÉTAPE 1: Lister tous les utilisateurs
  for (let i = 0; i < PERMANENT_TOKENS.length; i++) {
    const token = PERMANENT_TOKENS[i];

    console.log("\n" + "-".repeat(70));
    console.log(`👤 USER #${i + 1}`);
    console.log("-".repeat(70));

    const userInfo = await getUserInfo(token);

    if (userInfo) {
      const connections = await getConnections(token);
      const deletedConnections = await getDeletedConnections(token);

      const activeConnections = connections?.connections || [];
      const historicalConnections = deletedConnections?.logs || [];
      const totalConnectionsCreated = activeConnections.length + historicalConnections.length;

      users.push({
        index: i + 1,
        token: token,
        id: userInfo.id,
        email: userInfo.signin || "N/A",
        created: userInfo.created || "N/A",
        connections: activeConnections,
        historicalConnections: historicalConnections,
        totalConnectionsCreated: totalConnectionsCreated
      });

      console.log(`\n📋 Résumé:`);
      console.log(`   ID: ${userInfo.id}`);
      console.log(`   Email/Created: ${userInfo.signin || "N/A"}`);
      console.log(`   Connexions actives: ${activeConnections.length}`);
      console.log(`   Connexions historiques (supprimées): ${historicalConnections.length}`);
      console.log(`   TOTAL créé par cet user: ${totalConnectionsCreated}`);
    }
  }

  // ÉTAPE 2: Afficher le résumé
  console.log("\n" + "=".repeat(70));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(70));

  if (users.length === 0) {
    console.log("\n⚠️  Aucun utilisateur actif trouvé.");
    console.log("   Les tokens sont peut-être expirés ou invalides.\n");
    return;
  }

  console.log(`\n✅ ${users.length} utilisateur(s) trouvé(s):\n`);

  let totalActiveConnections = 0;
  let totalHistoricalConnections = 0;
  let totalAllTimeConnections = 0;

  users.forEach(user => {
    totalActiveConnections += user.connections.length;
    totalHistoricalConnections += user.historicalConnections.length;
    totalAllTimeConnections += user.totalConnectionsCreated;

    console.log(`   ${user.index}. ID: ${user.id} | Actives: ${user.connections.length} | Historiques: ${user.historicalConnections.length} | Total créé: ${user.totalConnectionsCreated}`);
  });

  console.log(`\n${"─".repeat(70)}`);
  console.log(`📊 STATISTIQUES GLOBALES:`);
  console.log(`   • Connexions actives actuellement: ${totalActiveConnections}/50`);
  console.log(`   • Connexions supprimées (historique): ${totalHistoricalConnections}`);
  console.log(`   • Total de connexions créées (all-time): ${totalAllTimeConnections}/50`);
  console.log(`   • Slots disponibles: ${50 - totalActiveConnections} connexions`);
  console.log(`${"─".repeat(70)}`);

  console.log("\n" + "=".repeat(70));
  console.log("🗑️  SUPPRESSION DU USER 175");
  console.log("=".repeat(70));

  // Supprimer uniquement le user 175 (qui a 1 connexion)
  const user175 = users.find(u => u.id === 175);

  if (!user175) {
    console.log("\n⚠️  User 175 non trouvé. Aucune suppression effectuée.");
  } else {
    console.log(`\n⚠️  Suppression du user 175 avec ${user175.connections.length} connexion(s)...\n`);

    const deleted = await deleteUser(user175.token, user175.id);

    if (deleted) {
      console.log(`\n✅ User 175 supprimé avec succès!`);
      console.log(`   Le user 201 est conservé et reste disponible.`);
    } else {
      console.log(`\n❌ Échec de la suppression du user 175`);
    }
  }

  console.log("\n" + "=".repeat(70));
}

main().catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
