-- CARSI Hub — Seed: News Feed Sources (23 RSS feeds)

INSERT INTO public.news_feed_sources (name, rss_url, industry_categories, fetch_interval_minutes, is_active)
VALUES
  ('IICRC News', 'https://iicrc.org/feed/', '["restoration","standards","water damage","mould remediation","carpet cleaning"]', 60, true),
  ('Restoration & Remediation Magazine', 'https://www.randrmagonline.com/rss/topic/restoration', '["restoration","water damage","fire damage","mould remediation"]', 60, true),
  ('Cleanfax', 'https://www.cleanfax.com/feed/', '["carpet cleaning","hard floor cleaning","restoration"]', 60, true),
  ('Indoor Air Quality Association', 'https://www.iaqa.org/news/feed/', '["indoor air quality","mould remediation","healthy homes"]', 60, true),
  ('AIRAH (Australian HVAC)', 'https://www.airah.org.au/rss', '["hvac","air conditioning","refrigeration","indoor air quality"]', 60, true),
  ('ACRA Australia', 'https://www.acra.org.au/feed/', '["restoration","water damage","carpet cleaning"]', 60, true),
  ('Restoration Industry Association', 'https://www.restorationindustry.org/rss', '["restoration","water damage","fire damage","mould remediation"]', 60, true),
  ('Pest Manager Magazine Australia', 'https://www.pestmanager.com.au/feed/', '["pest control"]', 60, true),
  ('Pest Control Technology', 'https://www.pctonline.com/rss', '["pest control"]', 60, true),
  ('HVACandR News Australia', 'https://hvacrnews.com.au/feed/', '["hvac","air conditioning","refrigeration"]', 60, true),
  ('AIRINEWS', 'https://www.airinews.com.au/feed/', '["hvac","air conditioning"]', 60, true),
  ('Flooring Magazine Australia', 'https://www.flooringmagazine.com.au/feed/', '["flooring","carpet cleaning"]', 60, true),
  ('Cleaning & Maintenance Management', 'https://www.cmmonline.com/rss', '["carpet cleaning","commercial cleaning","hard floor cleaning"]', 60, true),
  ('Building Connection Magazine', 'https://buildingconnection.com.au/feed/', '["restoration","construction","building services"]', 60, true),
  ('Insurance News Australia', 'https://www.insurancenews.com.au/rss.xml', '["insurance","restoration","disaster recovery"]', 60, true),
  ('IAG (Insurance Australia Group) Newsroom', 'https://www.iag.com.au/rss', '["insurance","disaster recovery"]', 60, true),
  ('ABC Australia — Environment', 'https://www.abc.net.au/news/feed/2942460/rss.xml', '["disaster recovery","restoration","healthy homes"]', 60, true),
  ('Safe Work Australia', 'https://www.safeworkaustralia.gov.au/rss', '["occupational hygiene","healthy homes","indoor air quality"]', 60, true),
  ('WorkSafe Queensland', 'https://www.worksafe.qld.gov.au/rss', '["occupational hygiene","healthy homes"]', 60, true),
  ('Dehumidifier Australia Blog', 'https://dehumidifieraustralia.com.au/feed/', '["restoration","water damage","structural drying"]', 60, true),
  ('Carpet Institute of Australia', 'https://www.carpetinstitute.com.au/rss', '["carpet cleaning","flooring"]', 60, true),
  ('Australian Water Association', 'https://www.awa.asn.au/rss', '["water damage","healthy homes"]', 60, true),
  ('Master Plumbers Australia', 'https://plumber.com.au/feed/', '["water damage","restoration","building services"]', 60, true)
ON CONFLICT (rss_url) DO NOTHING;
