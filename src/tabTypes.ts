export type StudentTabKey = "companies" | "profile" | "messages";
export type BusinessTabKey = "students" | "shortlist" | "messages" | "profile" | "pipeline";

// All possible tab keys in the navbar:
export type TabKey = StudentTabKey | BusinessTabKey;

export type TabConfig<K extends string = TabKey> = {
  key: K;
  label: string;
};
