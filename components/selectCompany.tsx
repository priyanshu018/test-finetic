"use client";

import React, { useEffect, useState } from "react";
import { getCompanyData } from "../service/tally";

type SelectCompanyProps = {
  onCompanySelect: (company: string) => void;
};

export default function SelectCompany({ onCompanySelect }: SelectCompanyProps) {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [companyList, setCompanyList] = useState<string[]>([]);

  const fetchCompanies = async () => {

    try {
      const response: any = await getCompanyData();
      if (response.success && Array.isArray(response.data)) {
        setCompanyList(response.data);
      } else {
        setCompanyList([]);
        console.error("Error fetching companies:", response.error);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanyList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      onCompanySelect(selectedCompany);
    }
  }, [selectedCompany]);

  return (
    <div className="p-8 space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700"
          >
            Select Company
          </label>
          <div className="relative">
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-black border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border-2"
            >
              <option value="">-- Select a company --</option>
              {companyList.length === 0 && (
                <option value="" disabled>
                  No companies available
                </option>
              )}
              {companyList.map((company, index) => (
                <option key={index} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
