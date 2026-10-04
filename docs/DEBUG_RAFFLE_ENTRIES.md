# Debug: Raffle Entries Showing 0

## Quick Checks

1. **Check Browser Console** (F12)
   - Look for errors when loading the Raffle page
   - Check for messages like "Found X coin numbers for user..."

2. **Verify User Has Approved Donations**
   - Go to Admin → Data Management
   - Check if your donations are marked as "confirmed" (green checkmark)
   - Coin numbers are only assigned when donations are approved

3. **Check Firestore Data**
   - Go to Firebase Console → Firestore Database
   - Navigate to `users/{yourUserId}/coinNumbers`
   - Verify documents exist with `coinNumber` field

4. **Check User Document**
   - In Firebase Console, check `users/{yourUserId}`
   - Verify `charityCoins` field is greater than 0

## Common Issues

### Issue 1: No Approved Donations
**Symptom**: Raffle page shows 0 entries
**Solution**: Have an admin approve your donations

### Issue 2: Firestore Permission Error
**Symptom**: Console shows "Missing or insufficient permissions"
**Solution**: 
- Check Firestore rules are deployed
- Verify user is authenticated
- Check user has admin role if needed

### Issue 3: Coin Numbers Not Created
**Symptom**: Donations approved but no coin numbers in Firestore
**Solution**: 
- Check browser console for errors during donation approval
- Verify the approval process completed successfully
- Check `users/{userId}/coinNumbers` collection exists

## Testing

1. **Make a test donation** (if you're an admin)
2. **Approve the donation** from Admin → Data Management
3. **Check Firestore** - verify coin numbers were created
4. **Refresh Raffle page** - entries should appear

## If Still Not Working

Check browser console for:
- Error messages
- Network requests to Firestore
- Authentication state

The code now logs helpful messages - check the console for "Found X coin numbers for user..."

