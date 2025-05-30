        privy = new Privy({
            appId: privyAppId,
            storage: localStorageAdapter // Use the custom adapter
        });
        console.log('Privy SDK initialized with custom storage adapter.');
        await privy.initialize();
        console.log('Privy iframe ready. Inspecting Privy object:', privy);
            console.log('Attempting privy.auth.guest.create()...');
            if (privy.auth && privy.auth.guest && typeof privy.auth.guest.create === 'function') {
                const { user: guestUser } = await privy.auth.guest.create();
                user = guestUser;
                console.log('privy.auth.guest.create() completed. User:', user);
                console.error('FATAL: privy.auth.guest.create method not available.');
                const embeddedWallet = await privy.embeddedWallet.create({});
