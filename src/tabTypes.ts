export type StudentTabKey = "businesses" | "shortlist" | "edit-profile";
export type BusinessTabKey = "students" | "shortlist" | "messages";

// All possible tab keys in the navbar:
export type TabKey = StudentTabKey | BusinessTabKey;

export type TabConfig<K extends string = TabKey> = {
  key: K;
  label: string;
};
