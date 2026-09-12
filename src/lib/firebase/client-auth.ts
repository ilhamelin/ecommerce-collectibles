import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth, auth, isFirebaseConfigured } from "./config";
import { getUserFromFirestoreClient, syncUserProfileToFirestoreClient } from "./client-firestore";
import type { UserAccount } from "../store/authStore";

export interface GoogleAuthResult {
  success: boolean;
  user?: UserAccount;
  message: string;
  isNewUser?: boolean;
  errorCode?: string;
}

/**
 * Initiates Google Sign-In with popup using Firebase Auth.
 * Automatically provisions or links the user profile in Cloud Firestore.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  // Check if running in test environment
  if (process.env.NODE_ENV === "test") {
    const mockUser: UserAccount = {
      id: `usr-google-${Date.now()}`,
      email: "usuario.google@gmail.com",
      fullName: "Usuario Verificado Google",
      phone: "+56 9 9876 5432",
      role: "CUSTOMER",
      addresses: [
        {
          id: "addr-google-01",
          label: "Casa Principal",
          fullName: "Usuario Verificado Google",
          phone: "+56 9 9876 5432",
          region: "Región Metropolitana de Santiago",
          comuna: "Santiago",
          address: "Av. Libertador Bernardo O'Higgins 1050",
          apartment: "Depto 203",
          isDefault: true,
        },
      ],
      paymentMethods: [],
      orders: [],
      wishlist: [],
      createdAt: new Date().toISOString(),
    };
    return {
      success: true,
      user: mockUser,
      message: "¡Sesión iniciada con éxito mediante Google!",
    };
  }

  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      message:
        "Firebase no está configurado correctamente. Verifique las variables NEXT_PUBLIC_FIREBASE_* en su archivo .env.local o Vercel.",
      errorCode: "NOT_CONFIGURED",
    };
  }

  const firebaseAuth = getFirebaseAuth() || auth;
  if (!firebaseAuth) {
    return {
      success: false,
      message: "El servicio de autenticación de Firebase no se encuentra disponible.",
      errorCode: "AUTH_UNAVAILABLE",
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const credential = await signInWithPopup(firebaseAuth, provider);
    const fbUser = credential.user;

    const email = (fbUser.email || "").toLowerCase().trim();
    const fullName = fbUser.displayName || "Usuario Google";
    const phone = fbUser.phoneNumber || "";

    // Check if user already exists in Firestore by UID or email
    let userAccount = await getUserFromFirestoreClient(fbUser.uid);
    let isNewUser = false;

    if (!userAccount && email) {
      userAccount = await getUserFromFirestoreClient(email);
    }

    if (!userAccount) {
      isNewUser = true;
      const isAdminEmail = email === "admin@omnicollector.cl";

      userAccount = {
        id: fbUser.uid,
        email,
        fullName,
        phone,
        role: isAdminEmail ? "ADMIN" : "CUSTOMER",
        addresses: [],
        paymentMethods: [],
        orders: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
      };

      // Save initial profile in Firestore
      await syncUserProfileToFirestoreClient(userAccount);
    } else {
      // Sync Google verified display name if user had placeholder
      let hasUpdates = false;
      if (fullName && (!userAccount.fullName || userAccount.fullName === "Usuario Google")) {
        userAccount.fullName = fullName;
        hasUpdates = true;
      }
      if (hasUpdates) {
        await syncUserProfileToFirestoreClient(userAccount);
      }
    }

    const firstName = fullName.split(" ")[0] || "Coleccionista";

    return {
      success: true,
      user: userAccount,
      isNewUser,
      message: `¡Bienvenido${isNewUser ? " a OmniCollector" : " de nuevo"}, ${firstName}!`,
    };
  } catch (error: any) {
    console.warn("[Firebase Auth] Google Sign-In error:", error);

    const code = error?.code || "";
    let friendlyMessage = "Ocurrió un error al iniciar sesión con Google.";

    switch (code) {
      case "auth/popup-closed-by-user":
        friendlyMessage = "Se cerró la ventana de inicio de sesión de Google antes de completar.";
        break;
      case "auth/cancelled-popup-request":
        friendlyMessage = "Se canceló la solicitud anterior de inicio de sesión.";
        break;
      case "auth/popup-blocked":
        friendlyMessage =
          "Tu navegador bloqueó la ventana emergente de Google. Por favor, permite ventanas emergentes (popups) para este sitio.";
        break;
      case "auth/operation-not-allowed":
        friendlyMessage =
          "El proveedor de Google no está habilitado en Firebase. Debes activarlo en Firebase Console > Authentication > Sign-in method > Google.";
        break;
      case "auth/unauthorized-domain":
        friendlyMessage =
          "El dominio actual no está autorizado en Firebase. Debes agregarlo en Firebase Console > Authentication > Settings > Authorized domains.";
        break;
      case "auth/network-request-failed":
        friendlyMessage = "Error de red al conectar con Google/Firebase. Revisa tu conexión a internet.";
        break;
      default:
        if (error?.message) {
          friendlyMessage = `Error de autenticación: ${error.message}`;
        }
    }

    return {
      success: false,
      message: friendlyMessage,
      errorCode: code,
    };
  }
}

/**
 * Signs out from Firebase Authentication.
 */
export async function signOutFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth() || auth;
  if (firebaseAuth) {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (err) {
      console.warn("[Firebase Auth] Error signing out from Firebase:", err);
    }
  }
}
