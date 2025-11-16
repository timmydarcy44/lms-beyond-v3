"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Users, User, Shield, GraduationCap, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/queries/contacts";

type ContactSelectorProps = {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null) => void;
  placeholder?: string;
  className?: string;
};

export function ContactSelector({
  contacts,
  selectedContactId,
  onSelectContact,
  placeholder = "Rechercher un contact...",
  className,
}: ContactSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Afficher le contact sélectionné dans le champ de recherche
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  
  // Filtrer les contacts en temps réel pendant la saisie
  const filteredContacts = search.trim()
    ? contacts.filter((contact) =>
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email?.toLowerCase().includes(search.toLowerCase())
      )
    : []; // Ne rien afficher si le champ est vide

  // Grouper les résultats filtrés
  const groupedContacts = {
    admin: filteredContacts.filter((c) => c.type === "admin"),
    instructor: filteredContacts.filter((c) => c.type === "instructor"),
    learner: filteredContacts.filter((c) => c.type === "learner"),
    group: filteredContacts.filter((c) => c.type === "group"),
  };

  const totalFiltered = filteredContacts.length;

  const getContactIcon = (type: Contact["type"]) => {
    switch (type) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "instructor":
        return <GraduationCap className="h-4 w-4" />;
      case "learner":
        return <User className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
    }
  };

  const getContactTypeLabel = (type: Contact["type"]) => {
    switch (type) {
      case "admin":
        return "Admin";
      case "instructor":
        return "Formateur";
      case "learner":
        return "Apprenant";
      case "group":
        return "Groupe";
    }
  };

  // Ouvrir le dropdown quand on commence à taper
  useEffect(() => {
    if (search.trim().length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [search, isOpen]);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Gérer la navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalFiltered - 1 ? prev + 1 : prev));
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      setIsOpen(true);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const flatContacts = [
        ...groupedContacts.admin,
        ...groupedContacts.instructor,
        ...groupedContacts.learner,
        ...groupedContacts.group,
      ];
      if (flatContacts[highlightedIndex]) {
        onSelectContact(flatContacts[highlightedIndex].id);
        setSearch("");
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (contactId: string) => {
    onSelectContact(contactId);
    setSearch("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Scroller vers l'élément mis en surbrillance
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-highlight-index]");
      const highlightedItem = items[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  // Liste plate des contacts pour la navigation clavier
  const flatContacts = [
    ...groupedContacts.admin,
    ...groupedContacts.instructor,
    ...groupedContacts.learner,
    ...groupedContacts.group,
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (search.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedContact ? `${selectedContact.name} (${getContactTypeLabel(selectedContact.type)})` : placeholder}
          className={cn(
            "pl-9 pr-9",
            selectedContact && "bg-accent"
          )}
        />
        {selectedContact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(null);
              setSearch("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown avec résultats */}
      {isOpen && search.trim() && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-popover shadow-lg max-h-[400px] overflow-hidden">
          <div ref={listRef} className="overflow-y-auto max-h-[400px]">
            {totalFiltered === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun contact trouvé pour "{search}"
              </div>
            ) : (
              <div className="p-2">
                {groupedContacts.admin.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Administrateurs
                    </div>
                    {groupedContacts.admin.map((contact, index) => {
                      const flatIndex = flatContacts.indexOf(contact);
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          data-highlight-index={flatIndex}
                          onClick={() => handleSelect(contact.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-accent focus:bg-accent focus:outline-none",
                            selectedContactId === contact.id && "bg-accent",
                            highlightedIndex === flatIndex && "bg-accent ring-2 ring-ring"
                          )}
                        >
                          {getContactIcon(contact.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{contact.name}</div>
                            {contact.email && (
                              <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                            )}
                          </div>
                          {selectedContactId === contact.id && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                            {getContactTypeLabel(contact.type)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {groupedContacts.instructor.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Formateurs
                    </div>
                    {groupedContacts.instructor.map((contact) => {
                      const flatIndex = flatContacts.indexOf(contact);
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          data-highlight-index={flatIndex}
                          onClick={() => handleSelect(contact.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-accent focus:bg-accent focus:outline-none",
                            selectedContactId === contact.id && "bg-accent",
                            highlightedIndex === flatIndex && "bg-accent ring-2 ring-ring"
                          )}
                        >
                          {getContactIcon(contact.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{contact.name}</div>
                            {contact.email && (
                              <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                            )}
                          </div>
                          {selectedContactId === contact.id && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                            {getContactTypeLabel(contact.type)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {groupedContacts.learner.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Apprenants
                    </div>
                    {groupedContacts.learner.map((contact) => {
                      const flatIndex = flatContacts.indexOf(contact);
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          data-highlight-index={flatIndex}
                          onClick={() => handleSelect(contact.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-accent focus:bg-accent focus:outline-none",
                            selectedContactId === contact.id && "bg-accent",
                            highlightedIndex === flatIndex && "bg-accent ring-2 ring-ring"
                          )}
                        >
                          {getContactIcon(contact.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{contact.name}</div>
                            {contact.email && (
                              <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                            )}
                          </div>
                          {selectedContactId === contact.id && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                            {getContactTypeLabel(contact.type)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {groupedContacts.group.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Groupes
                    </div>
                    {groupedContacts.group.map((contact) => {
                      const flatIndex = flatContacts.indexOf(contact);
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          data-highlight-index={flatIndex}
                          onClick={() => handleSelect(contact.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-accent focus:bg-accent focus:outline-none",
                            selectedContactId === contact.id && "bg-accent",
                            highlightedIndex === flatIndex && "bg-accent ring-2 ring-ring"
                          )}
                        >
                          {getContactIcon(contact.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{contact.name}</div>
                          </div>
                          {selectedContactId === contact.id && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                            {getContactTypeLabel(contact.type)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

