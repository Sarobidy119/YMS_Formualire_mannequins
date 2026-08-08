-- Les utilisateurs connectés peuvent voir les castings publiés par YMS.
drop policy if exists castings_authenticated_read on castings;
create policy castings_authenticated_read on castings for select using (auth.role() = 'authenticated');
