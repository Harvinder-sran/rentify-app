CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('Electronics','Tools','Vehicles','Sports','Books','Other')),
  price_per_day numeric(10,2) NOT NULL CHECK (price_per_day >= 0),
  image_urls text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES profiles(id),
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    listing_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status = 'confirmed');

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: select/update own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: select active or own
CREATE POLICY "listings_select_active" ON listings FOR SELECT USING (is_active = true OR auth.uid() = owner_id);
CREATE POLICY "listings_insert_own" ON listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "listings_update_own" ON listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "listings_delete_own" ON listings FOR DELETE USING (auth.uid() = owner_id);

-- Bookings: renter sees own, owner sees on their listings
CREATE POLICY "bookings_select_renter" ON bookings FOR SELECT USING (auth.uid() = renter_id);
CREATE POLICY "bookings_select_owner" ON bookings FOR SELECT USING (
  auth.uid() IN (SELECT owner_id FROM listings WHERE id = listing_id)
);
CREATE POLICY "bookings_insert_renter" ON bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "bookings_update_renter" ON bookings FOR UPDATE USING (auth.uid() = renter_id);
