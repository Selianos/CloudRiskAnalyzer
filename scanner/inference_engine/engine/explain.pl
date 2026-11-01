/*  engine/explain.pl : explanation facility

    Owner:    Inference programmer
    Name:     <write your name>
    Tasks:    T4.4
    Contract: INTERFACES.md section 4
    Report:   3.3.3 Explanation Facility
    Uses:     rule_info/3, name/2
*/

%!  explain(+Path) is det.
%
%   Prints one line per step of Path (as returned by attack_path/2), with
%   the display names of From and To (name/2) and the rule description
%   (rule_info/3). Steps answer "how" a path was found; rule names answer
%   "why".

explain(_Path) :-
    abstract(explain/1, 'T4.4').
