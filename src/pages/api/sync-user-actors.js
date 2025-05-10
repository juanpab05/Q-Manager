// This file creates a Supabase Edge Function that will sync users to the actors table
// You'll need to deploy this to your Supabase project

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the current authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Parse the request body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First check if the user is already in actors
    const { data: existingActor, error: existingActorError } = await supabaseClient
      .from('actors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingActorError && existingActorError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: `Error checking existing actor: ${existingActorError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // If user is not in actors table, add them
    if (!existingActor) {
      const { data: insertData, error: insertError } = await supabaseClient
        .from('actors')
        .insert([{
          user_id: userId,
          has_priority: false,
          motive: null
        }])
        .select()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Error inserting actor: ${insertError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User successfully added to actors table',
          data: insertData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // User already exists in actors table
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User already exists in actors table',
        data: existingActor
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 