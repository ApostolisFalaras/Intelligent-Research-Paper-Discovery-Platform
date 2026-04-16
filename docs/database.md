# Database Schema

## papers (Central table)
Central papers table

- id (Primary key)
- title
- abstract
- publication_year
- venue
- doi
- pdf_url (where to find the full paper content)
- created_at (when was the record created in the DB)
- updated_at (when and if the record was updated in the DB)

## authors
Central author table

- id (Primary Key)
- full_name
- affiliation
- orcid (Open Research and Contributor ID -- nullable)
- created_at  

## paper_authors
It documents the papers an author has contributed to

- paper_id (Foreign key to papers.id, part of Primary key)
- author_id (Foreign key to authors.id, part of Primary key)
- author_order

## citations
One paper can cite many papers, and one paper can be cited by many papers

- citing_paper_id (Foreign key to papers.id, part of Primary key)
- cited_paper_id (Foreign key to papers.id, part of Primary key)

## users
Central users table

- id (Primary key)
- username
- email
- password_hash
- full_name
- bio
- created_at
- updated_at

## folders
Additional feature that allows users to group bookmarked papers into folders,
enabling quicker access and project organization

- id (Primary key)
- user_id (Foreign key to users.id)
- name
- description
- created_at

## folder_papers
Connection of folders and individual papers

- folder_id (Foreign key to folders.id, part of Primary Key)
- paper_id (Foreign Key to papers.id, part of Primary Key)
- added_at