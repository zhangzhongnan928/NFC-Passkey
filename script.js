document.addEventListener('DOMContentLoaded', () => {
    const claimButton = document.getElementById('claimButton');
    const statusMessage = document.getElementById('statusMessage');

    claimButton.addEventListener('click', async () => {
        statusMessage.textContent = 'Initializing Passkey creation...';

        if (!navigator.credentials || !navigator.credentials.create) {
            statusMessage.textContent = 'WebAuthn API is not supported in this browser.';
            return;
        }

        try {
            // 1. Generate a challenge (should come from the server in a real application)
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // 2. Relying Party (RP) information (your website)
            const rp = {
                name: 'NFC Passkey Demo',
                id: window.location.hostname, // Important: This should match your domain
            };

            // 3. User information (should be handled by your server)
            // For demo, generate a random user ID
            const userId = new Uint8Array(16);
            window.crypto.getRandomValues(userId);
            const user = {
                id: userId,
                name: `user-${Math.random().toString(36).substr(2, 9)}@example.com`,
                displayName: `User ${Math.random().toString(36).substr(2, 5)}`,
            };

            // 4. Public key credential parameters
            const pubKeyCredParams = [
                {
                    type: 'public-key',
                    alg: -7, // ES256 (common algorithm)
                },
                {
                    type: 'public-key',
                    alg: -257, // RS256
                }
            ];

            const creationOptions = {
                challenge,
                rp,
                user,
                pubKeyCredParams,
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // or 'cross-platform'
                    requireResidentKey: true, // Store the key on the authenticator
                    userVerification: 'preferred', // e.g., Touch ID, Face ID, PIN
                },
                timeout: 60000, // 60 seconds
                attestation: 'direct', // or 'none', 'indirect'
            };

            statusMessage.textContent = 'Waiting for Passkey creation... Please follow browser/OS prompts.';
            const credential = await navigator.credentials.create({ publicKey: creationOptions });

            if (credential) {
                statusMessage.textContent = 'Passkey created successfully! Simulating Apple Pass issuance and account creation...';
                console.log('Passkey credential created:', credential);

                // Simulate backend processing
                await new Promise(resolve => setTimeout(resolve, 1500)); 

                statusMessage.textContent = 'Apple Pass issued and account created! (Simulated)';
                claimButton.disabled = true;
                claimButton.textContent = 'Claimed!';
            } else {
                statusMessage.textContent = 'Passkey creation failed or was cancelled.';
            }
        } catch (error) {
            console.error('Error creating passkey:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            if (error.name === 'NotAllowedError') {
                statusMessage.textContent = 'Passkey creation was cancelled or not allowed. Please try again.';
            }
        }
    });
}); 