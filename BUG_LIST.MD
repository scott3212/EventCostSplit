1, Event date shows incorrect:
    - Create event, select event data to be Sep 16
    - Event created successfully, but reopen the event the evnet date will become Sep 15. Event main page also shows this event card date is Sep 15.
2, Can't remove email from a user:
    - Create a new user, with email
    - Modify the user by removing the email
    - Two issues identified:
        - Can't save due to validation error
        - The "Failed to update user. Please try again." error window is behind the "edit-user-modal" div. (When click save, the "edit-user-modal" doesn't close if error happens and the error dialog is behind "edit-user-modal")
3, Can't navigate out from Event:
    - Go to event tab
    - Open any event
    - Click on Dashboard tab, or User tab. 
    - Page stays in Event tab
4, Missing User Detail implementation
    - Go to user tab
    - Click on any user
    - pop up shows "User details view coming soon!"
    - Please check our conversation to check if this is missed or it's planned to implement in the future.