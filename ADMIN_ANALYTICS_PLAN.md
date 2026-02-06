# Admin Dashboard Analytics & Insights Plan

## Overview
Enhance the admin dashboard (Reach Capital) with analytics and insights beyond user counts to demonstrate value to portfolio companies. Track engagement, introductions, and conversion metrics.

## Goals
- Provide visibility into platform activity and engagement
- Track which companies are actively using the platform
- Monitor introduction/conversation activity
- Measure conversion metrics (e.g., conversations → hires)
- Generate insights to demonstrate ROI to portfolio companies

---

## 1. Messaging Activity Analytics

### Metrics to Track
- **Active Conversations**: Number of ongoing conversations per company
- **Message Volume**: Total messages sent/received per company
- **Response Rates**: How quickly companies respond to students
- **Most Active Companies**: Top companies by conversation count
- **Most Active Students**: Top students by conversation count
- **Time-based Trends**: Messaging activity over time (daily/weekly/monthly)

### UI Components Needed
- **Messaging Activity Dashboard**:
  - Summary cards: Total conversations, active this week, response rate
  - Company leaderboard: Top companies by conversation activity
  - Activity timeline: Messaging trends over time
  - Company detail view: Drill down into specific company's messaging stats

### Data Sources
- `conversations` table
- `messages` table (if exists) or `conversation_participants`
- `accounts` table (for company/user info)

---

## 2. Introduction Tracking

### Metrics to Track
- **Total Introductions**: Number of conversations initiated per company
- **Introduction Rate**: Conversations per company per time period
- **Student-Company Matches**: Which students are talking to which companies
- **Introduction Quality**: Average conversation length, message count
- **First Contact Metrics**: Time to first message after account creation
- **Introduction Funnel**: 
  - Students viewed → Shortlisted → Conversation started

### UI Components Needed
- **Introduction Analytics Tab**:
  - Introduction overview: Total, by company, by student
  - Match matrix: Visual representation of student-company connections
  - Introduction timeline: When introductions happened
  - Company performance: Which companies are most active in initiating conversations
  - Student engagement: Which students are most responsive

### Data Sources
- `conversations` table (with `company_id` and `student_id`)
- `shortlists` table (to track shortlist → conversation conversion)
- `submissions` table (student data)
- `accounts` table (company data)

---

## 3. Conversion Metrics

### Metrics to Track
- **Shortlist Conversion**: Students viewed → Shortlisted
- **Conversation Conversion**: Shortlisted → Conversation started
- **Engagement Rate**: Active companies vs. total companies
- **Student Engagement**: Active students vs. total students
- **Time to Action**: Average time from profile view to conversation
- **Conversion Funnel**:
  ```
  Profile Views → Shortlists → Conversations → [Future: Hires/Offers]
  ```

### UI Components Needed
- **Conversion Dashboard**:
  - Funnel visualization: Shows drop-off at each stage
  - Conversion rates: Percentage at each stage
  - Company conversion leaderboard: Which companies convert best
  - Student conversion metrics: Which students are most engaged
  - Time-to-conversion metrics: How long each stage takes

### Data Sources
- `submissions` table (for student profiles)
- `shortlists` table (for shortlist data)
- `conversations` table (for conversation data)
- Potentially need to add tracking for profile views (if not already tracked)

---

## 4. Company Performance Dashboard

### Metrics to Track
- **Company Engagement Score**: Composite metric based on:
  - Number of active conversations
  - Response rate
  - Time to first response
  - Number of students shortlisted
- **Company Activity Timeline**: When companies were most active
- **Top Performing Companies**: Ranked by engagement metrics
- **Company Comparison**: Compare multiple companies side-by-side

### UI Components Needed
- **Company Performance Tab**:
  - Company list with key metrics
  - Individual company detail pages
  - Comparison view (select multiple companies)
  - Export functionality for reports

---

## 5. Student Engagement Metrics

### Metrics to Track
- **Active Students**: Students who have conversations
- **Response Rate**: How quickly students respond
- **Profile Completeness**: Percentage of students with complete profiles
- **Student Activity Score**: Based on profile views, shortlists, conversations

### UI Components Needed
- **Student Engagement Tab**:
  - Student activity overview
  - Most engaged students
  - Student response metrics
  - Profile completion rates

---

## 6. Reporting & Export Features

### Features Needed
- **Portfolio Company Reports**: 
  - Generate reports for individual companies
  - Show their activity, introductions, engagement
  - Export as PDF or CSV
- **Aggregate Reports**:
  - Platform-wide metrics
  - Monthly/quarterly summaries
  - Trend analysis
- **Custom Date Ranges**: Filter all metrics by date range
- **Scheduled Reports**: Email reports to stakeholders

---

## 7. Implementation Considerations

### Database Changes Needed
1. **Analytics/Events Table** (optional):
   - Track profile views, shortlist actions, conversation starts
   - Timestamp all key events for trend analysis
   
2. **Indexes**:
   - Ensure proper indexes on `conversations`, `shortlists` for fast queries
   - Index on timestamps for time-based queries

3. **Aggregation Views/Functions**:
   - Consider materialized views for common aggregations
   - Database functions for complex calculations

### Performance Considerations
- Cache frequently accessed metrics
- Use pagination for large datasets
- Consider background jobs for heavy calculations
- Optimize queries with proper indexes

### Security & Privacy
- Ensure RLS policies allow admins to see all data
- Consider anonymization for sensitive metrics
- Respect student privacy in aggregate reports

---

## 8. UI/UX Design Considerations

### Dashboard Layout
- **Overview Tab**: High-level metrics and KPIs
- **Companies Tab**: Company-specific analytics
- **Students Tab**: Student engagement metrics
- **Conversations Tab**: Messaging activity and trends
- **Reports Tab**: Generate and download reports

### Visualization Types
- Line charts for trends over time
- Bar charts for comparisons
- Funnel charts for conversion tracking
- Heatmaps for activity patterns
- Tables for detailed data

### Real-time vs. Cached
- Real-time: Current active conversations, recent activity
- Cached: Historical trends, aggregate metrics (refresh periodically)

---

## 9. Priority Implementation Order

### Phase 1: Foundation (MVP)
1. Basic messaging activity metrics
2. Introduction count tracking
3. Simple conversion funnel (shortlist → conversation)
4. Company activity overview

### Phase 2: Enhanced Analytics
1. Time-based trends and charts
2. Response rate metrics
3. Student engagement metrics
4. Company performance scoring

### Phase 3: Advanced Features
1. Custom reports and exports
2. Scheduled reports
3. Advanced filtering and segmentation
4. Predictive analytics (if needed)

---

## 10. Key Questions to Answer

1. **What defines "active"?**
   - Last login within X days?
   - Has conversations in last X days?
   - Has shortlisted in last X days?

2. **What's a "conversion"?**
   - Shortlist → Conversation?
   - Conversation → Hire? (if we track that)
   - Profile view → Shortlist?

3. **How do we measure "value"?**
   - Number of introductions made?
   - Quality of matches?
   - Student placement success?

4. **What data do we currently have?**
   - Review existing tables and relationships
   - Identify gaps in tracking
   - Plan what needs to be added

---

## 11. Technical Stack Considerations

### Frontend
- Charting library (e.g., Recharts, Chart.js, or similar)
- Date range picker component
- Export functionality (CSV, PDF)
- Responsive design for mobile viewing

### Backend
- Efficient database queries
- Caching layer (if needed)
- Background jobs for aggregations
- API endpoints for analytics data

---

## Next Steps

1. **Review Current Data Model**: 
   - Audit existing tables and relationships
   - Identify what's already tracked vs. what needs to be added

2. **Define Success Metrics**:
   - What KPIs matter most to Reach Capital?
   - What metrics demonstrate value to portfolio companies?

3. **Design Database Schema**:
   - Plan any new tables/columns needed
   - Design aggregation strategies

4. **Create Mockups**:
   - Design dashboard layouts
   - Plan visualization types
   - User flow for accessing reports

5. **Build MVP**:
   - Start with Phase 1 features
   - Get feedback from stakeholders
   - Iterate based on usage

---

## Notes

- This is a planning document - implementation details will be refined during development
- Consider starting with simple metrics and adding complexity based on actual usage
- Regular feedback from Reach Capital team will be crucial for prioritizing features
- Some metrics may require additional tracking to be added to the application
