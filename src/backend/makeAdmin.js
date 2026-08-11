const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }
  
  // Update the first (and supposedly only) user
  const user = users[0];
  console.log(`Found user: ${user.username} (ID: ${user.id})`);
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'admin',
      adminAccess: true,
      memberAccess: true,
      visitorAccess: true,
      supporterAccess: true,
      vendorAccess: true,
      groupAccess: true,
      donationAccess: true,
      expenseAccess: true,
      chargesAccess: true,
      checksAccess: true,
      reportsAccess: true,
      depositAccess: true,
      bankAccess: true,
      eventAccess: true,
      // Grant add permissions
      canAddMember: true,
      canAddVisitor: true,
      canAddSupporter: true,
      canAddVendor: true,
      canAddGroup: true,
      canAddDonation: true,
      canAddExpense: true,
      canAddCharges: true,
      canAddChecks: true,
      canAddReports: true,
      canAddDeposit: true,
      canAddBank: true,
      canAddEvent: true,
      // Grant delete permissions (by setting cannotDelete to false)
      cannotDeleteMember: false,
      cannotDeleteVisitor: false,
      cannotDeleteSupporter: false,
      cannotDeleteVendor: false,
      cannotDeleteGroup: false,
      cannotDeleteDonation: false,
      cannotDeleteExpense: false,
      cannotDeleteCharges: false,
      cannotDeleteChecks: false,
      cannotDeleteReports: false,
      cannotDeleteDeposit: false,
      cannotDeleteBank: false,
      cannotDeleteEvent: false,
    }
  });

  console.log(`Successfully made ${updatedUser.username} an admin with full permissions!`);
}

main()
  .catch(e => {
    console.error("Error updating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
