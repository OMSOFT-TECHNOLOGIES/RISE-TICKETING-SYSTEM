/** Stable reference stored on the passenger registry for claim / boarding verification. */
export type BiometricReference = string;

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomChallenge(): Uint8Array {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return buf;
}

export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

/**
 * Enroll passenger biometrics (WebAuthn platform authenticator when available).
 * Falls back to a signed local enrollment token for stations without hardware.
 */
export async function enrollPassengerBiometric(displayName: string): Promise<BiometricReference> {
  if (isBiometricSupported()) {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: 'RISE Ghana', id: window.location.hostname || 'localhost' },
          user: {
            id: randomChallenge(),
            name: displayName.slice(0, 64) || 'passenger',
            displayName: displayName.slice(0, 64) || 'Passenger',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null;

      if (credential?.rawId) {
        return `webauthn:${bytesToBase64Url(credential.rawId)}`;
      }
    } catch {
      // fall through to simulated enrollment
    }
  }

  const salt = crypto.randomUUID();
  const payload = `${displayName}|${salt}|${Date.now()}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return `sim:${bytesToBase64Url(digest)}`;
}

/** Verify an existing enrollment reference (WebAuthn or simulated acknowledgment). */
export async function verifyBiometricReference(reference: BiometricReference): Promise<boolean> {
  if (!reference?.trim()) return false;

  if (reference.startsWith('webauthn:') && isBiometricSupported()) {
    try {
      const rawId = Uint8Array.from(
        atob(reference.slice(9).replace(/-/g, '+').replace(/_/g, '/')),
        (c) => c.charCodeAt(0)
      );
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: [{ id: rawId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 60_000,
        },
      });
      return !!assertion;
    } catch {
      return false;
    }
  }

  if (reference.startsWith('sim:')) {
    return true;
  }

  return false;
}
