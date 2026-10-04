# Nonprofit Selection Feature

This document describes the new nonprofit selection functionality added to the Charity Coin donation system.

## Overview

Donors can now choose which nonprofit organization they want to support when making a donation. This feature includes:

1. **Nonprofit Management**: Admin interface to manage the list of available nonprofits
2. **Donor Selection**: Dropdown menu on the donation page for donors to select a nonprofit
3. **Transaction Tracking**: All donations and related transactions now include nonprofit information
4. **Admin Dashboard**: Enhanced admin interface to view and manage nonprofit-related data

## Features

### 1. Admin Nonprofit Management (`/admin-nonprofits`)

**Access**: Admin users only

**Features**:
- Add new nonprofits with name, description, website, category, and active status
- Edit existing nonprofit information
- Delete nonprofits
- View all nonprofits in a table format
- Toggle nonprofit active/inactive status

**Nonprofit Categories**:
- Education
- Healthcare
- Community Development
- Youth Programs
- Arts & Culture
- Environmental
- Social Services
- Economic Development
- Other

### 2. Donor Nonprofit Selection

**Location**: Donation page (`/donate`)

**Features**:
- Dropdown menu showing all active nonprofits
- Nonprofit description display when selected
- Required field - donors must select a nonprofit before donating
- Nonprofit information included in donation summary

### 3. Enhanced Transaction Tracking

**Updates**:
- All donation transactions now include `nonprofitId` and `nonprofitName`
- Coin reward and raffle entry transactions include nonprofit information
- Admin data management page shows nonprofit column
- Wallet transaction history displays nonprofit information

## Database Schema

### Nonprofits Collection

```javascript
{
  id: "auto-generated",
  name: "Nonprofit Name",
  description: "Brief description of the nonprofit's mission",
  website: "https://example.org",
  category: "Education",
  active: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### Updated Donations Collection

```javascript
{
  // ... existing fields
  nonprofitId: "nonprofit-document-id",
  nonprofitName: "Nonprofit Name",
  nonprofitCategory: "Education"
}
```

### Updated User Transactions Subcollection

```javascript
{
  // ... existing fields
  nonprofitId: "nonprofit-document-id",
  nonprofitName: "Nonprofit Name"
}
```

## Implementation Details

### Files Modified

1. **`src/pages/admin-nonprofits.jsx`** - New admin page for nonprofit management
2. **`src/pages/Donate.jsx`** - Added nonprofit selection functionality
3. **`src/pages/admin-data-management.jsx`** - Added nonprofit column to donations table
4. **`src/pages/Wallet.jsx`** - Added nonprofit information to transaction history
5. **`src/pages/admin.jsx`** - Added link to nonprofit management
6. **`src/App.jsx`** - Added route for admin nonprofits page

### Key Functions

#### Fetching Nonprofits
```javascript
const fetchNonprofits = async () => {
  const querySnapshot = await getDocs(collection(db, 'nonprofits'));
  const nonprofitList = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).filter(nonprofit => nonprofit.active);
  setNonprofits(nonprofitList);
};
```

#### Adding Nonprofit to Donation
```javascript
const donationData = {
  // ... existing fields
  nonprofitId: selectedNonprofit,
  nonprofitName: selectedNonprofitData?.name || 'Unknown Nonprofit',
  nonprofitCategory: selectedNonprofitData?.category || ''
};
```

## Usage Instructions

### For Admins

1. **Access Nonprofit Management**:
   - Go to Admin Dashboard (`/admin`)
   - Click "Nonprofit Management" card
   - Or navigate directly to `/admin-nonprofits`

2. **Add a New Nonprofit**:
   - Fill out the form at the top of the page
   - Include name, description, website, and category
   - Set active status (only active nonprofits appear to donors)
   - Click "Add Nonprofit"

3. **Edit Nonprofit**:
   - Click the edit icon (pencil) next to any nonprofit
   - Modify the information inline
   - Click the save icon (checkmark) to save changes
   - Click the cancel icon (X) to cancel

4. **Delete Nonprofit**:
   - Click the delete icon (trash) next to any nonprofit
   - Confirm deletion in the popup dialog

### For Donors

1. **Select Nonprofit**:
   - Go to the Donate page (`/donate`)
   - Scroll to the "Select Nonprofit to Support" section
   - Choose from the dropdown menu of active nonprofits
   - View the nonprofit description that appears below

2. **Complete Donation**:
   - Select donation amount and type
   - Review donation summary (includes selected nonprofit)
   - Complete the donation process

## Sample Data

Sample nonprofits can be added manually through the admin interface at `/admin/nonprofits`.

Sample nonprofits include:
- The Black History Foundation (Education)
- Community Health Initiative (Healthcare)
- Youth Empowerment Network (Youth Programs)
- Arts & Culture Collective (Arts & Culture)
- Environmental Justice Alliance (Environmental)
- Economic Development Center (Economic Development)
- Social Services Network (Social Services)
- Community Development Foundation (Community Development)

## Security Considerations

- Only admin users can access nonprofit management
- Nonprofit selection is required for donations
- Only active nonprofits appear in the donor dropdown
- Nonprofit information is validated and sanitized

## Future Enhancements

Potential future improvements:
- Nonprofit logos and images
- Donation allocation percentages (split between multiple nonprofits)
- Nonprofit-specific impact metrics
- Donor preferences for favorite nonprofits
- Nonprofit performance ratings and reviews
- Integration with nonprofit verification APIs 