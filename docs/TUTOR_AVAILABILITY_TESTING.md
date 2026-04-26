# Tutor Availability System - Testing Guide

## Quick Setup Checklist

- [ ] Run database schema migration (adds `tutor_availability` table)
- [ ] Rebuild backend (Spring Boot picks up new entity)
- [ ] Restart backend application
- [ ] Clear frontend cache and rebuild app
- [ ] Test as tutor user

---

## Unit Testing

### Backend Tests

**Test 1: Saving Availability**
```java
@Test
public void testSaveAvailability() {
    TutorAvailability av = tutorAvailabilityService.saveAvailability(
        1L, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(17, 0)
    );
    assertNotNull(av.getId());
    assertEquals(DayOfWeek.MONDAY, av.getDayOfWeek());
}
```

**Test 2: Prevent Duplicate Slots**
```java
@Test
public void testNoDuplicateSlots() {
    tutorAvailabilityService.saveAvailability(
        1L, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(17, 0)
    );
    TutorAvailability duplicate = tutorAvailabilityService.saveAvailability(
        1L, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(17, 0)
    );
    // Should return existing slot, not create new one
    assertNotNull(duplicate);
}
```

**Test 3: Time Validation**
```java
@Test
public void testInvalidTimeRange() {
    assertThrows(IllegalArgumentException.class, () -> {
        tutorAvailabilityService.saveAvailability(
            1L, DayOfWeek.MONDAY, 
            LocalTime.of(17, 0), LocalTime.of(14, 0) // End before start
        );
    });
}
```

**Test 4: Current Availability Check**
```java
@Test
public void testIsTutorCurrentlyAvailable() {
    // Setup: Monday 14:00-17:00
    tutorAvailabilityService.saveAvailability(
        1L, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(17, 0)
    );
    
    // If today is Monday and time is 14:30
    boolean available = tutorAvailabilityService.isTutorCurrentlyAvailable(1L);
    assertTrue(available);
}
```

---

## Integration Testing

### API Endpoint Tests

**Test 1: Add Availability via API**
```bash
# Request
POST http://localhost:8080/api/tutor/availability?tutorId=1&dayOfWeek=MONDAY&startTime=14:00&endTime=17:00

# Expected Response
Status: 200 OK
Body: {
  "message": "Availability saved successfully",
  "data": {
    "id": 1,
    "dayOfWeek": "MONDAY",
    "startTime": "14:00",
    "endTime": "17:00"
  }
}
```

**Test 2: Get All Slots**
```bash
# Request
GET http://localhost:8080/api/tutor/availability/1

# Expected Response
Status: 200 OK
Body: {
  "tutorId": 1,
  "availabilityCount": 1,
  "availabilities": [
    {
      "id": 1,
      "dayOfWeek": "MONDAY",
      "startTime": "14:00",
      "endTime": "17:00"
    }
  ]
}
```

**Test 3: Check Current Availability**
```bash
# Request
GET http://localhost:8080/api/tutor/availability/1/is-available-now

# If currently Monday 14:30
Response:
{
  "tutorId": 1,
  "isCurrentlyAvailable": true,
  "hasAvailabilitySet": true,
  "currentTime": "14:30:00"
}

# If currently Monday 18:00
Response:
{
  "tutorId": 1,
  "isCurrentlyAvailable": false,
  "hasAvailabilitySet": true,
  "currentTime": "18:00:00"
}
```

**Test 4: Delete Availability**
```bash
# Request
DELETE http://localhost:8080/api/tutor/availability/1

# Expected Response
Status: 200 OK
Body: {
  "message": "Availability deleted successfully"
}
```

**Test 5: Error Case - Invalid Times**
```bash
# Request (End time before start time)
POST http://localhost:8080/api/tutor/availability?tutorId=1&dayOfWeek=MONDAY&startTime=17:00&endTime=14:00

# Expected Response
Status: 400 Bad Request
Body: {
  "error": "Start time must be before end time"
}
```

---

## Manual Testing Scenarios

### Scenario 1: Complete Flow

1. **Setup:**
   - Login as Tutor with ID 1
   - Currently no availability set

2. **Expected Behavior:**
   - Home screen shows "📅 Set Your Availability"
   - Clicking button prompts to set availability
   - No students appear

3. **Action:**
   - Click "Set Your Availability"
   - Navigate to Session Availability tab
   - Add: Monday 2:00 PM - 5:00 PM

4. **Expected Result:**
   - Slot appears in list
   - If current time is within window: Home shows "✓ Students are waiting!"
   - If outside: Home shows "⏰ Not Currently Available"

### Scenario 2: Multiple Time Slots

1. **Setup:**
   - Add 3 slots:
     - Monday 14:00-17:00
     - Wednesday 10:00-13:00
     - Friday 15:00-18:00

2. **Test Each Day:**
   - Monday 14:30 → Available
   - Monday 09:00 → Not available
   - Wednesday 10:30 → Available
   - Thursday 14:00 → Not available (no Thursday slot)

3. **Expected:**
   - Button status changes throughout the week
   - Accurate time comparisons

### Scenario 3: Slot Management

1. **Setup:**
   - Add Monday 14:00-17:00

2. **Test Delete:**
   - Click delete button
   - Confirm deletion
   - Slot removed from list
   - Database updated

3. **Add Again:**
   - Add same slot again
   - Should create new entry (different ID)

### Scenario 4: Edge Cases

**Test Time Exactly at Boundaries:**
- Start time: 14:00
- End time: 17:00
- At 14:00 exactly → Should be available (≥ start)
- At 16:59 → Should be available
- At 17:00 exactly → Should NOT be available (< end)

**Test Midnight Wrap (if supported):**
- If allowing 23:00-02:00 (crosses midnight)
- Verify behavior (may need special handling)

---

## SQL Testing Queries

### Verify Table Created
```sql
SELECT * FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'tagakturo' AND TABLE_NAME = 'tutor_availability';
```

### View All Availability
```sql
SELECT 
  ta.id,
  t.name as tutor_name,
  ta.day_of_week,
  ta.start_time,
  ta.end_time
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.id
ORDER BY t.id, ta.day_of_week;
```

### Check for a Specific Tutor
```sql
SELECT * FROM tutor_availability WHERE tutor_id = 1;
```

### Insert Test Data
```sql
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
VALUES 
  (1, 'MONDAY', '14:00:00', '17:00:00'),
  (1, 'WEDNESDAY', '10:00:00', '13:00:00'),
  (1, 'FRIDAY', '15:00:00', '18:00:00'),
  (2, 'TUESDAY', '09:00:00', '12:00:00'),
  (2, 'THURSDAY', '16:00:00', '19:00:00');
```

### Verify Indices
```sql
SHOW INDEX FROM tutor_availability;
```

### Clear Test Data
```sql
DELETE FROM tutor_availability WHERE tutor_id = 1;
```

---

## Frontend Testing Checklist

- [ ] Availability settings screen loads without errors
- [ ] Can add a new availability slot
- [ ] Time picker works (both start and end)
- [ ] Can select all 7 days
- [ ] Validation prevents end time before start time
- [ ] Slots display in list after adding
- [ ] Can delete existing slots
- [ ] Home button shows correct status:
  - [ ] "📅 Set Your Availability" when no slots exist
  - [ ] "✓ Students are waiting!" when currently available
  - [ ] "⏰ Not Currently Available" when outside hours
- [ ] Status updates automatically (every 30 seconds)
- [ ] Network errors handled gracefully
- [ ] Smooth transitions between screens

---

## Performance Testing

### Availability Check Performance
```
Test: GET /api/tutor/availability/{tutorId}/is-available-now
Iterations: 1000
Expected: < 50ms per request
Reason: Simple DB query with indexed columns
```

### List All Slots Performance
```
Test: GET /api/tutor/availability/{tutorId}
Data: 52 slots (worst case: 7 days/week × many tutors)
Expected: < 100ms per request
```

### Polling Impact
```
Current: Every 30 seconds for active tutors
Requests/hour: 120
Network usage: Minimal (small JSON response)
CPU impact: Negligible
```

---

## Rollback Instructions

If issues occur:

1. **Database:**
   ```sql
   DROP TABLE tutor_availability;
   ```
   Re-run schema.sql without this table

2. **Backend:**
   - Remove TutorAvailability.java
   - Remove TutorAvailabilityRepository.java
   - Remove TutorAvailabilityService.java
   - Remove TutorAvailabilityController.java
   - Revert changes to tutor-homepage.tsx

3. **Frontend:**
   - Revert tutor-homepage.tsx to original version
   - Can keep session-availability.tsx (backward compatible)

---

## Known Limitations & Future Work

1. **Timezone**: Currently uses server's local time
   - Future: Store user timezone with availability

2. **Recurring Patterns**: Each slot is individual
   - Future: Support repeating patterns

3. **Overlapping Slots**: Currently allows
   - Future: Optional overlap checking/prevention

4. **Midnight Wrapping**: Not supported (23:00-02:00)
   - Future: Handle day-crossing times

---

## Support & Debugging

### Common Issues

**Issue: Button still shows "Set Availability" after adding slots**
- Solution: Wait 30 seconds for polling refresh
- Or: Force app refresh (reload screen)

**Issue: Slots not appearing after adding**
- Check: Network response in browser dev tools
- Verify: API returned 200 OK
- Clear: Frontend cache

**Issue: Always shows "Not Available" even during set hours**
- Verify: Current server time vs. device time
- Check: Database contains correct values
- Verify: DayOfWeek enum matches (case-sensitive)

### Debug Endpoints

Add debug endpoint (development only):
```java
@GetMapping("/debug/{tutorId}")
public ResponseEntity<?> debug(@PathVariable Long tutorId) {
    LocalTime now = LocalTime.now();
    DayOfWeek today = DayOfWeek.of(ZonedDateTime.now().getDayOfWeek().getValue());
    List<TutorAvailability> slots = repository.findByTutorId(tutorId);
    
    return ResponseEntity.ok(Map.of(
        "tutorId", tutorId,
        "currentTime", now,
        "currentDay", today,
        "slots", slots,
        "available", isTutorCurrentlyAvailable(tutorId)
    ));
}
```

---

## Deployment Checklist

- [ ] Schema migration applied to production DB
- [ ] Backend compiled and tested
- [ ] All 4 new Java files present
- [ ] Updated tutor-homepage.tsx deployed
- [ ] Updated session-availability.tsx deployed
- [ ] API endpoints responding
- [ ] Frontend can add/view/delete slots
- [ ] Availability status updating correctly
- [ ] No console errors
- [ ] Performance acceptable
