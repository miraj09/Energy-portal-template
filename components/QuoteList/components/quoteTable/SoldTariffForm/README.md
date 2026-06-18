# Sold Tariff Form Submission

This component handles the submission of sold tariff forms to the company API endpoint.

## API Endpoint
- **URL**: `/api/v1/auth/web/core/company/`
- **Method**: POST
- **Authentication**: Bearer token (handled automatically)

## Form Field Mapping

### Company Information
- `company_name` ← `form.companyName.label` or `form.companyName.value` (with fallback to "New Company")
- `registration_no` ← `form.regNo` (optional)
- `is_micro_business` ← `form.isMicroBusiness` (defaults to false)
- `number_of_employees` ← `form.employees` (optional)
- `estimated_turnover` ← `form.turnover` (optional)

### Address Information
- `current_address_line1` ← `form.address[0]` (required)
- `current_address_line2` ← `form.address[1]` (optional)
- `current_address_line3` ← `form.address[2]` (optional)
- `current_address_line4` ← `form.address[3]` (optional)
- `current_postcode` ← `form.postCode` (required)
- `home_address_line*` ← Same as current address (or empty if not available)
- `previous_address_line*` ← Empty strings (default)
- `time_at_current_address_months` ← Calculated from `form.timeAtAddressYear` and `form.timeAtAddressMonth` (defaults to 0)

### Contact Information
- `owner_partner_name` ← `form.ownerPartnerName` (optional)
- `owner_partner_dob` ← `form.ownerPartnerDOB` (optional)
- `primary_telephone_number` ← `form.telephoneNumber` (optional)
- `primary_contact_first_name` ← `form.primaryContactFirstName` (optional)
- `primary_contact_last_name` ← `form.primaryContactLastName` (optional)
- `primary_contact_position` ← `form.primaryContactPosition` (optional)
- `primary_contact_email` ← `form.primaryContactEmail` (optional)
- `primary_contact_title` ← `form.primaryContactTitle` (optional)

### Bank Details
- `account_number` ← `form.accountNumber` (optional)
- `sort_code` ← `form.sortCode` (optional)
- `bank_name` ← `form.bankName` (optional)
- `account_name` ← `form.accountName` (optional)

### Director Information
- `director_first_name` ← `form.directorFirstName` (optional)
- `director_last_name` ← `form.directorLastName` (optional)

### Trading Information
- `time_trading_for` ← `form.timeTradingFor` (optional)
- `incorporated_date` ← `form.incorporatedDate` (optional)

## Required Fields Only

The form now only requires the following essential fields:
- **Company Name** (with fallback to "New Company")
- **Post Code**
- **Address Line 1** (first line of address)

All other fields are optional and will use sensible defaults or empty values if not provided.

## Default Values for Missing Fields

The following fields are set to default values as they are not currently collected in the form:

### Required System Fields
- `lead_id`: 1
- `company_status_id`: 1
- `agent_user_id`: 1
- `partner_user_id`: 1
- `account_manager_user_id`: 1
- `created_user_id`: 1
- `last_modified_user_id`: 1

### Provider Information
- Gas, Electric, Telecoms, and GI provider fields: Empty strings
- Renewal dates: null
- Spending bands: Empty strings

### Business/Contract Fields
- `contracts_processed`: 0
- `contracts_issold`: false
- `business_type`: `form.businessType.value` (parsed as integer, or null if not selected)
- Various callback flags: false

## Validation

The form now only validates the following essential fields before submission:
- Company Name
- Post Code
- Address Line 1

All other fields are optional and the form will submit successfully even if they are empty.

## Success Flow

1. Form validation passes (only essential fields required)
2. Data is mapped to API payload schema with fallbacks
3. POST request is sent to the API endpoint
4. Success message is displayed
5. User is redirected to `/protected/all-applications` after 3 seconds

## Error Handling

- Validation errors: Alert with missing essential field names
- API errors: Alert with error message from API
- Network errors: Generic error message
- All errors are logged to console for debugging

## Benefits of Optional Fields

- **Faster form completion**: Users can submit with minimal information
- **Flexible data collection**: Additional fields can be filled later
- **Better user experience**: No blocking validation for non-essential data
- **Progressive enhancement**: Form works with partial data

## Future Enhancements

To make this form production-ready, consider adding:
1. Input fields for the missing provider information
2. Previous address collection
3. Dynamic loading of user IDs from context
4. Better error messages and field-level validation
5. Form data persistence across page refreshes
6. Field-level validation indicators (optional)
7. Save draft functionality for partial submissions
