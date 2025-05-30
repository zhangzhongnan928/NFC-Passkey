import Privy from '@privy-io/js-sdk-core';

// Add PrivyClient if you were to use the SDK directly
// For now, we simulate the Privy interaction.

document.addEventListener('DOMContentLoaded', async () => {
    const claimButton = document.getElementById('claimButton');
    const statusMessage = document.getElementById('statusMessage');
    const privyAppId = 'cmb9z52y600o1ky0m78whsb08'; // Your Privy App ID
    let privy = null;

    // Custom LocalStorage Adapter for Privy
    const localStorageAdapter = {
        get: (key) => {
            try {
                return window.localStorage.getItem(key);
            } catch (error) {
                console.error('LocalStorageAdapter: Error getting item', key, error);
                // Potentially update UI or status message if storage is completely blocked
                statusMessage.textContent = 'Error: Browser storage is inaccessible. Please check your browser settings (e.g., disable "Block all cookies").';
                claimButton.disabled = true;
                return null;
            }
        },
        put: (key, value) => {
            try {
                window.localStorage.setItem(key, value);
            } catch (error) {
                console.error('LocalStorageAdapter: Error setting item', key, error);
                statusMessage.textContent = 'Error: Browser storage is inaccessible. Please check your browser settings.';
                claimButton.disabled = true;
            }
        },
        del: (key) => {
            try {
                window.localStorage.removeItem(key);
            } catch (error) {
                console.error('LocalStorageAdapter: Error deleting item', key, error);
                statusMessage.textContent = 'Error: Browser storage is inaccessible. Please check your browser settings.';
                claimButton.disabled = true;
            }
        },
        // getKeys is optional, but good to have if Privy uses it.
        getKeys: () => {
            try {
                return Object.keys(window.localStorage);
            } catch (error) {
                console.error('LocalStorageAdapter: Error getting keys', error);
                 statusMessage.textContent = 'Error: Browser storage is inaccessible. Please check your browser settings.';
                claimButton.disabled = true;
                return [];
            }
        }
    };

    try {
        privy = new Privy({
            appId: privyAppId,
            storage: localStorageAdapter // Use the custom adapter
        });
        console.log('Privy SDK initialized with custom storage adapter.');
        await privy.initialize();
        console.log('Privy iframe ready. Inspecting Privy object:', privy);
    } catch (error) {
        statusMessage.textContent = 'Error: Account system components failed to initialize. Please refresh.';
        claimButton.disabled = true;
        console.error('Error initializing Privy SDK:', error);
        return;
    }

    // Helper function to convert string to Uint8Array
    function stringToUint8Array(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    async function createGuestUserAndWallet() {
        statusMessage.textContent = 'Setting up your secure account...';
        let user;
        let walletAddress;
        
        try {
            statusMessage.textContent = 'Creating new guest account...';
            console.log('Attempting privy.auth.guest.create()...');

            if (privy.auth && privy.auth.guest && typeof privy.auth.guest.create === 'function') {
                const { user: guestUser } = await privy.auth.guest.create();
                user = guestUser;
                console.log('privy.auth.guest.create() completed. User:', user);
            } else {
                console.error('FATAL: privy.auth.guest.create method not available.');
                throw new Error('Headless guest account creation method not available in SDK.');
            }

            if (!user) {
                // This case means createGuestAccount was called but returned a falsy value (e.g. null/undefined)
                console.error('Guest account creation function was called but returned no user.');
                throw new Error('Guest account creation attempt returned no user.');
            }
            console.log('Guest user session active. User ID:', user.id);
            statusMessage.textContent = 'Guest account active. Setting up secure storage...';

            // Now that we have a user (guest), check if they already have a wallet from a previous session
            if (user.wallet && user.wallet.address) {
                 walletAddress = user.wallet.address;
                 console.log('Guest user already has a wallet:', walletAddress);
            } else {
                console.log('Attempting privy.embeddedWallet.create() for guest user...');
                const embeddedWallet = await privy.embeddedWallet.create({});
                console.log('privy.embeddedWallet.create() completed. Wallet:', embeddedWallet);

                if (!embeddedWallet || !embeddedWallet.address) {
                    throw new Error('Secure storage (wallet) creation failed for guest.');
                }
                walletAddress = embeddedWallet.address;
                console.log('New secure storage (wallet) created for guest:', walletAddress);
            }
            
            statusMessage.textContent = `Account ready: ${walletAddress.substring(0, 10)}...`;
            await new Promise(resolve => setTimeout(resolve, 1000));
            return walletAddress;

        } catch (error) {
            console.error('Privy guest/wallet setup error:', error);
            statusMessage.textContent = `Account setup error: ${error.message || 'An unknown error occurred.'}`;
            claimButton.disabled = false;
            throw error;
        }
    }

    claimButton.addEventListener('click', async () => {
        statusMessage.textContent = 'Initializing...';
        claimButton.disabled = true;

        try {
            const walletAddress = await createGuestUserAndWallet();
            if (!walletAddress) {
                // Error message already set by createGuestUserAndWallet
                claimButton.disabled = false;
                return;
            }

            statusMessage.textContent = 'Initializing secure sign-in method...';

            if (!navigator.credentials || !navigator.credentials.create) {
                statusMessage.textContent = 'Secure sign-in method (WebAuthn) is not supported.';
                claimButton.disabled = false;
                return;
            }

            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const rp = {
                name: 'NFC Passkey Demo',
                id: window.location.hostname,
            };

            const userId = stringToUint8Array(walletAddress); // Use wallet address as user ID for passkey
            const passkeyUser = {
                id: userId,
                name: walletAddress, 
                displayName: `User (${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)})`,
            };

            const pubKeyCredParams = [
                { type: 'public-key', alg: -7 }, // ES256
                { type: 'public-key', alg: -257 }, // RS256
            ];

            const creationOptions = {
                challenge,
                rp,
                user: passkeyUser,
                pubKeyCredParams,
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    requireResidentKey: true,
                    userVerification: 'preferred',
                },
                timeout: 60000,
                attestation: 'direct',
            };

            statusMessage.textContent = 'Please follow browser prompts to set up your secure sign-in.';
            const credential = await navigator.credentials.create({ publicKey: creationOptions });

            if (credential) {
                statusMessage.textContent = 'Sign-in method created! Opening your Stamp Card...';
                console.log('Passkey credential created:', credential);
                console.log('User ID (Wallet Address) used for passkey:', walletAddress);
                
                // TODO: Here you might want to link the created passkey credential to the Privy guest user
                // This typically involves sending credential details to your backend, which then uses Privy's admin SDK.
                // Or, check if Privy client-side SDK has a method to link a newly created passkey.
                // For now, we proceed directly to opening the pkpass file.

                window.location.href = 'demo.pkpass'; 
                claimButton.textContent = 'Claimed & Pass Opened!';
                
                setTimeout(() => {
                    if (document.hasFocus()) {
                        statusMessage.textContent = 'Stamp Card initiated. Check downloads or Wallet app (iOS).';
                    }
                }, 3000);
            } else {
                statusMessage.textContent = 'Secure sign-in setup failed or was cancelled.';
                claimButton.disabled = false;
            }
        } catch (error) {
            console.error('Overall process error:', error);
            if (!statusMessage.textContent.startsWith('Account setup error:')) { // Avoid overwriting specific setup errors
                 statusMessage.textContent = `Error: ${error.message || 'An unexpected error occurred.'}`;
            }
            if (error.name === 'NotAllowedError') {
                statusMessage.textContent = 'Operation was cancelled or not allowed. Please try again.';
            }
            claimButton.disabled = false;
        }
    });
}); 
