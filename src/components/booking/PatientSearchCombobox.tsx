'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone, getFakeEmail } from '@/lib/fake-data';

export interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth?: string | null;
}

interface PatientSearchComboboxProps {
  /** Called when a patient is selected */
  onSelect: (patient: PatientSearchResult) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to show recent patients when input is empty */
  showRecent?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * PatientSearchCombobox - Reusable patient search with autocomplete
 *
 * Features:
 * - Debounced search with loading state
 * - Recent patients display (optional)
 * - PHI protection on all patient data
 * - Keyboard navigation support
 * - Accessible dropdown pattern
 */
export function PatientSearchCombobox({
  onSelect,
  placeholder = 'Search by name, phone, or email...',
  showRecent = true,
  error,
  disabled = false,
}: PatientSearchComboboxProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent patients on mount
  useEffect(() => {
    if (!showRecent) return;

    const fetchRecentPatients = async () => {
      try {
        const response = await fetch('/api/patients?pageSize=5&sortBy=createdAt&sortOrder=desc');
        const result = await response.json();
        if (result.success) {
          setRecentPatients(result.data.items || []);
        }
      } catch {
        // Silent fail - recent patients are optional
      }
    };
    fetchRecentPatients();
  }, [showRecent]);

  // Search patients with debounce
  useEffect(() => {
    if (search.length < 2) {
      setPatients([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients?search=${encodeURIComponent(search)}&pageSize=10`);
        const result = await response.json();
        if (result.success) {
          setPatients(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSelect = (patient: PatientSearchResult) => {
    onSelect(patient);
    setSearch('');
    setPatients([]);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay close to allow click events on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  // Determine what to show in the dropdown
  const showSearchResults = search.length >= 2 && patients.length > 0;
  const showRecentPatients = showRecent && search.length < 2 && recentPatients.length > 0;
  const showDropdown = isOpen && (showSearchResults || showRecentPatients || loading);

  return (
    <Popover open={showDropdown}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="pl-10"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'patient-search-error' : undefined}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-60 overflow-auto"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Recent Patients Section */}
        {showRecentPatients && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
              Recent Patients
            </div>
            {recentPatients.map((patient) => (
              <PatientOption
                key={patient.id}
                patient={patient}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}

        {/* Search Results Section */}
        {showSearchResults && (
          <>
            {search.length >= 2 && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                Search Results
              </div>
            )}
            {patients.map((patient) => (
              <PatientOption
                key={patient.id}
                patient={patient}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}

        {/* Loading State */}
        {loading && !showSearchResults && !showRecentPatients && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            Searching...
          </div>
        )}

        {/* No Results */}
        {search.length >= 2 && !loading && patients.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No patients found
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface PatientOptionProps {
  patient: PatientSearchResult;
  onSelect: (patient: PatientSearchResult) => void;
}

function PatientOption({ patient, onSelect }: PatientOptionProps) {
  return (
    <button
      type="button"
      className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none flex items-center gap-2 cursor-pointer"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(patient);
      }}
    >
      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">
          <PhiProtected fakeData={getFakeName()}>
            {patient.firstName} {patient.lastName}
          </PhiProtected>
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {patient.phone && (
            <PhiProtected fakeData={getFakePhone()}>
              {patient.phone}
            </PhiProtected>
          )}
          {patient.phone && patient.email && ' • '}
          {patient.email && (
            <PhiProtected fakeData={getFakeEmail()}>
              {patient.email}
            </PhiProtected>
          )}
        </p>
      </div>
    </button>
  );
}
