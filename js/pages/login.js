import { getAuthClient, getDb, isConfigured } from "../firebase.js";
import { html, setOutlet, toast } from "../utils.js";
import { navigate } from "../router.js";

export async function renderLogin() {
  if (!isConfigured()) {
    setOutlet(html`
      <section class="max-w-md mx-auto px-6 py-24 text-center">
        <h1 class="text-3xl font-display">Firebase Not Connected</h1>
        <p class="mt-4 text-muted-foreground">Authentication requires Firebase configuration. Please check your credentials in the project configuration code.</p>
      </section>
    `);
    return;
  }
  
  let isRegister = false;
  
  const draw = () => {
    const outlet = setOutlet(html`
      <section class="max-w-md mx-auto px-6 py-20">
        <div class="text-center">
          <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 class="mt-2 text-4xl font-display">${isRegister ? "Create Account" : "Sign In"}</h1>
          <p class="mt-3 text-sm text-muted-foreground">
            ${isRegister ? "Join Zolly to manage your orders." : "Sign in to access your profile."}
          </p>
        </div>

        <form id="auth-form" class="mt-8 space-y-4">
          ${isRegister
            ? html`
                <label class="block">
                  <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Name</span>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-card focus:border-accent outline-none transition-colors"
                  />
                </label>
              `
            : ""}
          
          <label class="block">
            <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email Address</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-card focus:border-accent outline-none transition-colors"
            />
          </label>

          <label class="block">
            <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Password</span>
            <input
              name="password"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-card focus:border-accent outline-none transition-colors"
            />
          </label>

          <div id="auth-error" class="text-xs text-red-600 hidden"></div>

          <button
            type="submit"
            id="auth-submit"
            class="w-full h-12 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <span>${isRegister ? "Create Account" : "Sign In"}</span>
          </button>
        </form>

        <div class="mt-6 relative flex py-2 items-center">
          <div class="flex-grow border-t border-border"></div>
          <span class="flex-shrink mx-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">Or continue with</span>
          <div class="flex-grow border-t border-border"></div>
        </div>

        <button
          type="button"
          id="google-login"
          class="mt-4 w-full h-12 border border-border hover:bg-muted transition text-sm flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.256-3.13C18.44 1.91 15.6 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.984 0-.74-.08-1.3-.176-1.859H12.24z"
            />
          </svg>
          <span>Google Account</span>
        </button>

        <div class="mt-8 text-center text-sm">
          <button
            type="button"
            id="auth-toggle"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            ${isRegister
              ? "Already have an account? Sign in →"
              : "Don't have an account? Sign up →"}
          </button>
        </div>
      </section>
    `);

    // Add listeners
    const form = outlet.querySelector("#auth-form");
    const errorEl = outlet.querySelector("#auth-error");
    const submitBtn = outlet.querySelector("#auth-submit");
    const toggleBtn = outlet.querySelector("#auth-toggle");
    const googleBtn = outlet.querySelector("#google-login");

    toggleBtn.addEventListener("click", () => {
      isRegister = !isRegister;
      draw();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.classList.add("hidden");
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50");
      
      const formData = new FormData(form);
      const email = formData.get("email");
      const password = formData.get("password");
      const name = formData.get("name");

      try {
        const { auth, mod } = await getAuthClient();
        if (isRegister) {
          const userCredential = await mod.createUserWithEmailAndPassword(auth, email, password);
          if (name && name.trim()) {
            await mod.updateProfile(userCredential.user, { displayName: name.trim() });
          }
          
          // Create Firestore user document with default customer role
          try {
            const { db, mod: fsMod } = await getDb();
            await fsMod.setDoc(fsMod.doc(db, "users", userCredential.user.uid), {
              name: name ? name.trim() : "",
              email: email,
              role: "customer",
              createdAt: new Date().toISOString()
            });
          } catch (fsErr) {
            console.error("Failed to write Firestore user document on sign up:", fsErr);
          }

          toast("Account created successfully");
        } else {
          await mod.signInWithEmailAndPassword(auth, email, password);
          toast("Signed in successfully");
        }
        navigate("/profile");
      } catch (err) {
        console.error(err);
        errorEl.textContent = getErrorMessage(err);
        errorEl.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-50");
      }
    });

    googleBtn.addEventListener("click", async () => {
      errorEl.classList.add("hidden");
      googleBtn.disabled = true;
      googleBtn.classList.add("opacity-50");
      try {
        const { auth, mod } = await getAuthClient();
        const provider = new mod.GoogleAuthProvider();
        const userCredential = await mod.signInWithPopup(auth, provider);
        
        // Ensure Firestore user document exists with a default customer role
        try {
          const { db, mod: fsMod } = await getDb();
          const docRef = fsMod.doc(db, "users", userCredential.user.uid);
          const docSnap = await fsMod.getDoc(docRef);
          if (!docSnap.exists()) {
            await fsMod.setDoc(docRef, {
              name: userCredential.user.displayName || "",
              email: userCredential.user.email,
              role: "customer",
              createdAt: new Date().toISOString()
            });
          }
        } catch (fsErr) {
          console.error("Failed to ensure user document in Firestore on Google Sign-In:", fsErr);
        }

        toast("Signed in with Google");
        navigate("/profile");
      } catch (err) {
        console.error(err);
        errorEl.textContent = getErrorMessage(err);
        errorEl.classList.remove("hidden");
      } finally {
        googleBtn.disabled = false;
        googleBtn.classList.remove("opacity-50");
      }
    });
  };

  draw();
}

function getErrorMessage(err) {
  if (!err || !err.code) return err.message || "An unexpected error occurred.";
  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/popup-closed-by-user":
      return "Sign in popup closed by user.";
    default:
      return err.message;
  }
}
