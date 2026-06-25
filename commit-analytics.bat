@echo off
echo Creating Analytics System Implementation Commits...
echo.

echo =============================================
echo Commit 1: Core Analytics Types and Services
echo =============================================
git add src/types/analytics.ts
git add src/services/analytics/calculations.ts
git add src/services/analytics/filters.ts
git add src/services/analytics/index.ts
git commit -m "feat: Add analytics core types and calculation engine" -m "" -m "- Define comprehensive type system for analytics data" -m "- Implement performance metrics calculations (APY, returns, Sharpe ratio)" -m "- Add statistical functions (mean, median, std dev)" -m "- Create reward, flow, APY, and participation analytics" -m "- Implement time-based filtering and data aggregation" -m "- Add data transformation utilities (smoothing, sampling, interpolation)" -m "- Include formatting utilities for currency and percentages" -m "" -m "Pure functions with no side effects, fully testable."
echo.

echo ================================================
echo Commit 2: Visualization Components and Charts
echo ================================================
git add src/components/visualizations/PerformanceChart.tsx
git add src/components/visualizations/FlowChart.tsx
git add src/components/visualizations/APYChart.tsx
git add src/components/visualizations/index.ts
git commit -m "feat: Add interactive visualization components" -m "" -m "- Create PerformanceChart for balance tracking with rewards overlay" -m "- Implement FlowChart for deposit/withdrawal analysis" -m "- Add APYChart with volatility bands and trend indicators" -m "- Include custom tooltips with rich formatting" -m "- Add stats summaries below charts" -m "- Support interactive features (hover, reference lines)" -m "- Use gradient fills and modern styling" -m "" -m "Components are reusable, configurable, and responsive."
echo.

echo ================================================
echo Commit 3: Analytics Dashboard and Documentation
echo ================================================
git add src/features/analytics/AnalyticsDashboard.tsx
git add src/features/analytics/index.ts
git add docs/ANALYTICS.md
git add ANALYTICS_IMPLEMENTATION.md
git add commit-analytics.bat
git commit -m "feat: Add comprehensive analytics dashboard" -m "" -m "- Create AnalyticsDashboard with period filtering (24H-All)" -m "- Display key metrics cards (return, APY, rewards, flow)" -m "- Integrate all visualization components" -m "- Add loading states and error handling" -m "- Include participation and engagement metrics panel" -m "- Implement responsive grid layout" -m "- Add comprehensive documentation (ANALYTICS.md)" -m "- Include implementation summary" -m "" -m "Dashboard provides actionable insights into vault performance," -m "reward distribution, transaction flow, and user engagement."
echo.

echo ============================================
echo All commits created successfully!
echo ============================================
echo.
echo Review the commits with: git log --oneline -3
echo Push with: git push origin HEAD
echo.
pause
