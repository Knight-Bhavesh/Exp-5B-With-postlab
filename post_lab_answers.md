# Exp 5B: Post-lab Questions and Answers

### 1. How would you modify your API to check index usage using `.explain()` in Postman?
To check index usage via Postman, you can create a dedicated route or modify an existing one to append `.explain("executionStats")` to the Mongoose query.
**Implementation Example (included in backend):**
```javascript
// GET /api/users/explain?email=test@example.com
exports.explainQuery = async (req, res) => {
    try {
        const stats = await User.find(req.query).explain("executionStats");
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
```
When calling this endpoint from Postman, it circumvents standard model returning and instead returns the execution plan, allowing you to examine `totalKeysExamined` and `totalDocsExamined`.

---

### 2. You created a compound index: `{ email: 1, age: -1 }`. Which of the following queries will use this index and which will not? Explain why:

*   **`find({ email: "test@gmail.com" })`**
    *   **Uses Index?** YES
    *   **Reason:** MongoDB compound indexes support single-field queries if the field is the **prefix** of the index. Since `email` is the first field in the compound index, this query can leverage it.
*   **`find({ age: 25 })`**
    *   **Uses Index?** NO
    *   **Reason:** Since `age` is the second field, and `email` (the prefix) is completely missing from the query, MongoDB cannot use this compound index to satisfy the query directly.
*   **`find({ email: "test@gmail.com", age: 25 })`**
    *   **Uses Index?** YES
    *   **Reason:** The query uses both fields defined in the index, so it perfectly matches the index criteria and order.

---

### 3. If your schema has `email: { type: String, required: true, unique: true }`. What will happen if you send a POST request without email, or with a duplicate email? Will both give the same error? Explain the difference.

*   **Without email:** This will throw a **Mongoose Validation Error** (e.g., `ValidationError: email is required`). This happens at the application/Mongoose level *before* anything is even sent to the MongoDB server.
*   **With duplicate email:** This will throw a **MongoDB Duplicate Key Error** (Error code `11000`). This happens at the database level when MongoDB attempts to execute the insert and finds that the unique index constraint on the `email` field is violated.

**Explanation of Difference:**
They are fundamentally different errors. The missing email error is caught synchronously by Mongoose based on the defined Schema. The duplicate email error is an asynchronous error returned directly by the MongoDB database engine rejecting an insert that conflicts with its unique index.
