-- Création du Foreign Data Wrapper
CREATE FOREIGN DATA WRAPPER postgres_fdw
    VALIDATOR public.postgres_fdw_validator
    HANDLER public.postgres_fdw_handler;

-- Création du serveur distant
CREATE SERVER oxalis_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'IP_SERVER', port 'PORT_BASE', dbname 'NOM_BASE');

-- Mapping du user local avec le user distant
CREATE USER MAPPING FOR "USER_LOCAL" SERVER oxalis_server
    OPTIONS ("user" 'LOGIN', password 'MDP');

-- Création de la table étrangère dans la schema fdw_oxalis (par exemple)
CREATE FOREIGN TABLE IF NOT EXISTS fdw_oxalis.vl_ox_sigdosparc_aos(
    dossiernom character varying(100) OPTIONS (column_name 'dossiernom') NULL COLLATE pg_catalog."default",
    dosparcnom character varying(100) OPTIONS (column_name 'dosparcnom') NULL COLLATE pg_catalog."default"
)
    SERVER oxalis_server
    OPTIONS (schema_name 'Oxalis', table_name 'vl_ox_sigdosparc_aos');



-- Création de la table contenant les géométries des dossiers implantés
CREATE TABLE IF NOT EXISTS public.oxalis_implanter_dossier
(
    id integer NOT NULL DEFAULT nextval('oxalis_implanter_dossier_id_seq'::regclass),
    dossiernom text COLLATE pg_catalog."default",
    geom geometry(MultiPolygon,2154),
    CONSTRAINT oxalis_implanter_dossier_pkey PRIMARY KEY (id),
    CONSTRAINT dossiernom_unique UNIQUE (dossiernom)
)

-- Création de la fonction s'exécutant lors de l'UDPATE ou INSERT de la vue 'dossier_oxalis'
-- Si le dossier n'existe pas, il est créé
-- Si il existe, la géométrie est mise à jour
CREATE OR REPLACE FUNCTION public.dossier_oxalis_upsert()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   INSERT INTO oxalis_implanter_dossier (dossiernom, geom)
	VALUES(NEW.dossiernom,NEW.geom) 
	ON CONFLICT (dossiernom) 
	DO 
	   UPDATE SET geom = NEW.geom;
	   
	   RETURN NEW;
END;
$BODY$;

-- Cette vue affiche l'ensemble des parcelles cadastrales associées au dossiers oxalis
-- La géométrie est celle la table oxalis_implanter_dossier si elle existe sinon celle des parcelles fusionnées du cadastre
-- ATTENTION : le nom de la table 'cadastre_2021' doit être remplacé par celui de votre table
CREATE OR REPLACE VIEW public.dossier_oxalis
 AS
 SELECT row_number() OVER ()::integer AS id,
    dosparc.dossiernom,
    array_agg(dosparc.dosparcnom) AS parcelles,
    COALESCE(oxalis_implanter_dossier.geom, st_union(parcinfo.geom)) AS geom
   FROM fdw_oxalis.vl_ox_sigdosparc_aos dosparc
     LEFT JOIN oxalis_implanter_dossier ON oxalis_implanter_dossier.dossiernom = dosparc.dossiernom::text
     LEFT JOIN cadastre_2021.parcelle_info parcinfo ON parcinfo.geo_parcelle = replace(dosparc.dosparcnom::text, ' '::text, '0'::text)
  GROUP BY dosparc.dossiernom, oxalis_implanter_dossier.geom;

ALTER TABLE public.dossier_oxalis
    OWNER TO "morsini@centremorbihancommunaute";

-- Trigger permettant des INSERT et UPDATE sur la vue 'dossier_oxalis'
CREATE TRIGGER dossier_oxalis_trigger
    INSTEAD OF INSERT OR UPDATE 
    ON public.dossier_oxalis
    FOR EACH ROW
    EXECUTE FUNCTION public.dossier_oxalis_upsert();