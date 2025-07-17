const { User, Wallet, Transaction } = require('../models');
const sequelize = require('../config/database');

async function createSampleWalletData() {
  const t = await sequelize.transaction();

  try {
    console.log('🔧 [WALLET] Creating sample wallet data...');

    // Get all users
    const users = await User.findAll();
    console.log(`📊 [WALLET] Found ${users.length} users`);

    let walletsCreated = 0;
    let transactionsCreated = 0;

    for (const user of users) {
      // Check if wallet already exists
      let wallet = await Wallet.findOne({
        where: { user_id: user.id },
      });

      // Create wallet if not exists
      if (!wallet) {
        // Give admin users more money
        const initialBalance = user.role === 'admin' ? 10000000 : 1000000; // 10M for admin, 1M for regular users

        wallet = await Wallet.create(
          {
            user_id: user.id,
            balance: initialBalance,
            status: 'active',
          },
          { transaction: t }
        );

        walletsCreated++;

        // Create initial deposit transaction
        await Transaction.create(
          {
            wallet_id: wallet.id,
            type: 'deposit',
            amount: initialBalance,
            description: 'Tiền thưởng đăng ký tài khoản',
            status: 'completed',
            balance_before: 0,
            balance_after: initialBalance,
            created_by: user.id,
          },
          { transaction: t }
        );

        transactionsCreated++;

        console.log(
          `✅ [WALLET] Created wallet for user ${
            user.name || user.email
          } with balance: ${initialBalance.toLocaleString('vi-VN')} VND`
        );
      } else {
        console.log(
          `⚠️  [WALLET] Wallet already exists for user ${
            user.name || user.email
          }`
        );
      }
    }

    await t.commit();

    console.log('🎉 [WALLET] Sample data creation completed!');
    console.log(`📈 [WALLET] Summary:`);
    console.log(`   - Wallets created: ${walletsCreated}`);
    console.log(`   - Transactions created: ${transactionsCreated}`);
  } catch (error) {
    await t.rollback();
    console.error('❌ [WALLET] Error creating sample data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createSampleWalletData()
    .then(() => {
      console.log('✅ [WALLET] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ [WALLET] Script failed:', error);
      process.exit(1);
    });
}

module.exports = createSampleWalletData;
