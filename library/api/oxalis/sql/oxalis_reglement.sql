-- Table: public.oxalis_reglement

-- DROP TABLE IF EXISTS public.oxalis_reglement;

CREATE TABLE IF NOT EXISTS public.oxalis_reglement
(
    id serial NOT NULL,
    idparc text COLLATE pg_catalog."default" NOT NULL,
    commune text COLLATE pg_catalog."default",
    categorie text COLLATE pg_catalog."default",
    type text COLLATE pg_catalog."default",
    nomcourt text COLLATE pg_catalog."default",
    nomlong text COLLATE pg_catalog."default",
    commentaire text COLLATE pg_catalog."default",
    lien text COLLATE pg_catalog."default",
    pourcentage text COLLATE pg_catalog."default",
    surface text COLLATE pg_catalog."default",
    cosprincipal text COLLATE pg_catalog."default",
    cossecondaire text COLLATE pg_catalog."default",
    cosalternatif text COLLATE pg_catalog."default",
    datvalid text COLLATE pg_catalog."default",
    datefin text COLLATE pg_catalog."default",
    CONSTRAINT oxalis_reglement_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
