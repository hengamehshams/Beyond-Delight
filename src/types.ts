export interface BusinessInfo {
  name: string;
  industry: string;
  otherIndustry?: string;
  employees: string;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  options: { value: string; label: string; points: number }[];
}

export interface AnalysisReport {
  total_score: number;
  tier_label: string;
  scores_per_dimension: {
    user_research_and_data: number;
    customer_journey_and_ux: number;
    service_operations_and_staff: number;
    design_agility_and_testing: number;
  };
  greeting_summary: string;
  detailed_analysis: string;
  cta_message: string;
}
