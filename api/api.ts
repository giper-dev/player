namespace $ {
	
	export const $giper_player_api_kp_keys = [
		'3516f118-c2ee-4d16-9d16-e9a8d8512ec5',
		'ea706cda-7aee-452b-b897-3f13cfbcd579',
		'e7502905-63cc-4807-9eea-b1f8620bb79c',
	]
	
	const kp_api_options = ()=> ({
		headers: { 'X-API-KEY': $mol_wire_sync( $mol_array_lottery )( $giper_player_api_kp_keys ) as string },
	})
	
	export const $giper_player_api_movie_data_short = $mol_data_record({
		nameOriginal: $mol_data_nullable( $mol_data_string ),
		nameEn: $mol_data_nullable( $mol_data_string ),
		nameRu: $mol_data_nullable( $mol_data_string ),
		posterUrlPreview: $mol_data_string,
		kinopoiskId: $mol_data_integer,
		imdbId: $mol_data_nullable( $mol_data_string ),
		year: $mol_data_nullable( $mol_data_integer ),
		genres: $mol_data_array( $mol_data_record({
			genre: $mol_data_string,
		}) ),
	})
	
	export const $giper_player_api_search_movie_data = $mol_data_record({
		items: $mol_data_array( $giper_player_api_movie_data_short )
	})
	
	// export const $giper_player_api_similar_data = $mol_data_record({
	// 	... $giper_player_api_movie_data_short.config,
	// })
	
	// export const $giper_player_api_member = $mol_data_record({
	// 	description: $mol_data_nullable( $mol_data_string ),
	// 	name_en: $mol_data_string,
	// 	name_ru: $mol_data_string,
	// 	poster_url: $mol_data_string,
	// 	profession_key: $mol_data_string,
	// 	profession_text: $mol_data_string,
	// 	staff_id: $mol_data_integer,
	// })
	
	export const $giper_player_api_movie_data_full = $mol_data_record({
		... $giper_player_api_movie_data_short.config,
		filmLength: $mol_data_nullable( $mol_data_integer ),
		coverUrl: $mol_data_nullable( $mol_data_string ),
		slogan: $mol_data_nullable( $mol_data_string ),
		description: $mol_data_nullable( $mol_data_string ),
	})
	
	export const $giper_player_api_player_data = $mol_data_record({
		data: $mol_data_array( $mol_data_record({
			type: $mol_data_string,
			iframeUrl: $mol_data_nullable( $mol_data_string ),
		}) )
	})
	
	export class $giper_player_api extends $mol_object {
		
		/** API: https://kinopoiskapiunofficial.tech/documentation/api/ */
		@ $mol_mem_key
		static search( query: string ): Map< number, $giper_player_api_movie > {
			
			if( !query.trim() ) return new Map
			
			const keyword = encodeURIComponent( query )
			const resp = $giper_player_api_search_movie_data(
				this.$.$mol_fetch.json( `https://kinopoiskapiunofficial.tech/api/v2.2/films?keyword=${keyword}`, kp_api_options() ) as any
			)
			
			return new Map(
				resp.items.map( data => [ data.kinopoiskId, $giper_player_api_movie.make({
					id: $mol_const( data.kinopoiskId ),
					title: $mol_const( data.nameRu || data.nameEn || data.nameOriginal || `#${data.kinopoiskId}` ),
					poster: $mol_const( data.posterUrlPreview ),
					year: $mol_const( data.year ),
					genres: $mol_const( data.genres.map( g => g.genre ) ),
				}) ] )
			)
			
		}
		
	}
	
	export class $giper_player_api_movie extends $mol_object {
		
		id() {
			return 0
		}
		
		uri_kp() {
			return `https://kinopoisk.ru/film/${ this.id() }/`
		}
		
		uri_imdb() {
			return this.data().imdbId && `https://imdb.com/title/${ this.data().imdbId }/`
		}
		
		@ $mol_mem
		data() {
			return $giper_player_api_movie_data_full(
				this.$.$mol_fetch.json( `https://kinopoiskapiunofficial.tech/api/v2.2/films/${this.id()}`, kp_api_options() ) as any
			)
		}
		
		title() {
			return this.data().nameRu || this.data().nameEn || this.data().nameOriginal || this.id().toString()
		}
		
		year() {
			return this.data().year
		}
		
		poster() {
			return this.data().posterUrlPreview
		}
		
		cover() {
			return this.data().coverUrl
		}
		
		descr() {
			return this.data().description ?? ''
		}
		
		slogan() {
			return this.data().slogan ?? ''
		}
		
		@ $mol_mem
		genres() {
			return this.data().genres.map( g => g.genre )
		}
		
		@ $mol_mem
		similars() {
			return new Map(
				// [ ... this.data().sequels_and_prequels, ... this.data().similars ]
				// .map( sim => [ sim.film_id, $giper_player_api_movie.make({
				// 	id: $mol_const( sim.film_id ),
				// 	title: $mol_const( sim.nameRu || sim.nameEn || sim.nameOriginal || '???' ),
				// 	poster: $mol_const( sim.posterUrlPreview ),
				// }) ] )
			)
		}
		
		@ $mol_mem
		members() {
			// const members = $mol_array_groups( this.data().staff, item => ' ' + item.staff_id )
			return new Map(
				// [ ... Object.entries( members ) ].map( ([ id, items ])=> [
				// 	parseInt( id ),
				// 	items!.reduce( ( res, item )=> {
				// 		res.name = item.name_ru || item.name_en || res.name
				// 		res.photo = item.poster_url || res.photo
				// 		if( item.profession_key ) {
				// 			const prof = item.profession_key.toLowerCase()
				// 			res.roles.add( item.description ? `${prof} (${ item.description })` : prof )
				// 		}
				// 		return res
				// 	}, {
				// 		name: 'Anonymous',
				// 		photo: 'about:blank',
				// 		link: `https://www.kinopoisk.ru/name/${ parseInt( id ) }/`,
				// 		roles: new Set< string >(),
				// 	} )
				// ] )
			)
		}
		
		/**
		 * API: https://fbphdplay.top/api/players?kinopoisk=
		 * B plan: https://p.ddbb.lol/api/players?kinopoisk=
		 */
		@ $mol_mem
		players() {
			
			const resp = $giper_player_api_player_data(
				this.$.$mol_fetch.json( `https://fbphdplay.top/api/players?kinopoisk=${ this.id() }` ) as any
			).data
			.filter( data => data.iframeUrl )
			.toSorted( $mol_compare_text( data => data.type ) )
			
			return new Map( resp.map( data => [ data.type, $giper_player_api_player.make({ data: $mol_const( data ) }) ] ) )
		}
		
	}
	
	export class $giper_player_api_player extends $mol_object {
		
		data() {
			return null as any as ( typeof $giper_player_api_player_data.Value.data )[ number ]
		}
		
		title() {
			return this.data().type
		}
		
		uri() {
			return this.data().iframeUrl
		}
		
	}
	
}
