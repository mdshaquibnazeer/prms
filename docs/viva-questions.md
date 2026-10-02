# Viva Questions and Answers

## Project
**Q1. What is the objective of the project?** To build a patient record system where DSA concepts (Hash Map, Queue, Priority Queue, Heap, Linked List, searching, sorting) solve real hospital problems, backed by PostgreSQL.

**Q2. Which SDG does it support?** SDG 3 - Good Health & Well-being: faster patient lookup, fair queues and emergency prioritisation.

**Q3. Explain the architecture.** React UI -> REST API -> Express controller -> service layer -> DSA layer -> model (SQL) -> PostgreSQL. The DSA code in `backend/src/dsa` is separate from CRUD code.

**Q4. Is the DSA real or just documented?** Real. Every class is hand-written; `Map` and `Array.sort` are not used. The DSA page calls the backend, which runs these same classes. Tests: `npm test` (10 DSA unit tests) and `npm run test:api` (end-to-end).

**Q5. Database vs DSA - what is the difference?** PostgreSQL stores records permanently. DSA structures are in-memory, built from database rows for fast processing. Database primary key != Hash Map key.

## Hash Map
**Q6. Where is it used?** Patient ID -> patient record lookup, duplicate-ID check, ID search, existence checks.
**Q7. How are collisions handled?** Separate chaining: each bucket holds a chain of nodes. The DSA page has a "Demonstrate a collision" button that inserts keys that really land in one bucket.
**Q8. Why is lookup O(1) on average but O(n) worst case?** Normally each bucket has about one entry. If every key collides, one chain holds all n entries and must be walked.
**Q9. What is the load factor? What happens when it is high?** size / buckets. Above 0.75 the table doubles its buckets and re-hashes every key (O(n), but rare, so amortised O(1)).
**Q10. Why not use JavaScript Map?** The assignment is to understand and implement a hash map.

## Queue and Priority Queue
**Q11. Where is a Queue used?** Today's normal appointments - first booked, first served (FIFO).
**Q12. Why is dequeue O(1) here?** The queue is a linked list with head and tail pointers. `array.shift()` would be O(n).
**Q13. Where is the Priority Queue used?** Emergency queue: Critical (1), Emergency (2), Normal (3). Lower number = more urgent.
**Q14. What if two patients have the same priority?** A sequence number breaks ties, so the earlier arrival is served first.
**Q15. Queue vs priority queue?** A queue serves by arrival time; a priority queue serves by urgency.
**Q16. Is the emergency queue lost if the server restarts?** No. The waiting patients are stored in the `emergency_queue` table and the heap is rebuilt from it with heapify (O(n)).

## Heap
**Q17. What is a binary min-heap?** A complete binary tree in an array where every parent <= its children; the root is the minimum.
**Q18. Index formulas?** parent = floor((i-1)/2), left = 2i+1, right = 2i+2.
**Q19. How does insert work?** Add at the end, sift up while smaller than the parent. O(log n) because the tree height is log n.
**Q20. How does extract work?** Take the root, move the last element to the root, sift down by swapping with the smaller child. O(log n).
**Q21. Why is heapify O(n), not O(n log n)?** Most nodes are near the bottom and sift down only a few levels.

## Linked List
**Q22. Where is a linked list used?** A patient's medical history; each visit is a Node with a `next` pointer.
**Q23. Why not an array?** The history grows one visit at a time, and a linked list needs no resizing. With a tail pointer, append is O(1).
**Q24. Complexity of delete and search?** O(n): you must walk from the head to find the node.
**Q25. Array vs linked list?** Array: O(1) random access, costly middle insert/delete. Linked list: O(1) insert/delete once the node is known, no random access.

## Searching and Sorting
**Q26. Linear vs binary search?** Linear checks items one by one, O(n), works on any data. Binary halves the range, O(log n), requires sorted data.
**Q27. What if binary search runs on unsorted data?** It can miss existing items. The DSA page refuses and offers to Merge Sort first.
**Q28. Why Merge Sort?** Always O(n log n), stable, easy to explain; Quick Sort can degrade to O(n^2).
**Q29. What does stable mean?** Equal items keep their original relative order. Sorting by age keeps ID order among equal ages.
**Q30. Space complexity of Merge Sort?** O(n) for the temporary arrays.
**Q31. How does the Patients page use these?** Search can use Hash Map, Linear or Binary search; the result is always ordered with Merge Sort by the chosen field. A banner shows the algorithm, complexity and comparison count.

## Security and engineering
**Q32. How is authentication done?** Login checks the bcrypt hash and returns a JWT; the frontend sends it as a Bearer token; middleware verifies it on every protected route.
**Q33. Why bcrypt?** It is a slow, salted hash, so stolen hashes are hard to crack. Plain-text passwords are never stored.
**Q34. How is role-based access enforced?** `authorize(...roles)` middleware in the backend (e.g. receptionists get 403 on medical history). The UI also hides those actions, but the backend is the real check.
**Q35. How do you prevent SQL injection?** Parameterised queries (`$1, $2`) everywhere.
**Q36. Where is the JWT secret kept?** In `.env`, never in code; `.env` is git-ignored and `.env.example` shows the format.
**Q37. Time complexity table?** See the DSA page > About / DSA, or `docs/dsa-explanation.md`.
**Q38. Limitations?** The in-memory patient index is rebuilt on each write, which is fine for a college-scale dataset; with a very large dataset the database index would be used for paging. Future scope items (AI risk prediction, reminders, cloud deployment, etc.) are not implemented.
