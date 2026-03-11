import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);
import { useState, useEffect } from "react";

export function useFetchClassrooms(){
  const [classrooms, setClassrooms] = useState<any[]>([]);

  // Fetch classrooms from Supabase
  useEffect(() => {
    const fetchClassrooms = async () => {
      const { data, error } = await supabase
        .from("lecture_halls")
        .select("*")
        .order("id", { ascending: true });
      if (error) {
        console.error("Error fetching classrooms:", error);
      } else {
        setClassrooms(data || []);
      }
    };
    fetchClassrooms();
  }, []);
    return {classrooms}

}   